import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { canonicalStringify, sha256Hex, toDayKey } from './crypto-utils.js';
import { buildMerkleRoot } from './merkle.js';
import Reading from './models/Reading.js';
import Anchor from './models/Anchor.js';
import http from 'http';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const WITNESS_URLS = (process.env.WITNESS_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
const ANCHOR_QUORUM = parseInt(process.env.ANCHOR_QUORUM || '2', 10);
const RAW_RETENTION_DAYS = parseInt(process.env.RAW_RETENTION_DAYS || '90', 10);

await mongoose.connect(MONGO_URI);

// --- Helpers ---
function httpPostJson(url, body) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const data = Buffer.from(JSON.stringify(body));
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      const req = http.request(opts, (res) => {
        let raw = '';
        res.on('data', (d) => raw += d.toString());
        res.on('end', () => {
          try { resolve(JSON.parse(raw)); } catch (e) { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    } catch (e) { reject(e); }
  });
}

// --- Routes ---

// Ingest a sensor reading
app.post('/api/ingest', async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload required' });

    const ts = payload.timestamp ? new Date(payload.timestamp) : new Date();
    const dayKey = toDayKey(ts);
    const canonical = canonicalStringify(payload);
    const leafHash = sha256Hex(canonical);

    const doc = await Reading.create({ payload, leafHash, ts, dayKey });
    return res.json({ ok: true, id: doc._id, leafHash, dayKey });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'ingest_failed' });
  }
});

// Status for last 30 days
app.get('/api/status/30days', async (req, res) => {
  try {
    // Build list of last 30 dayKeys (UTC)
    const days = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      days.push(toDayKey(d));
    }
    const anchors = await Anchor.find({ dayKey: { $in: days } }).lean();
    const map = new Map(anchors.map(a => [a.dayKey, a]));
    const result = days.reverse().map(dayKey => {
      const a = map.get(dayKey);
      return {
        dayKey,
        anchored: !!a,
        quorumMet: !!a?.quorumMet,
        signatures: a ? a.signatures.length : 0
      };
    });
    res.json({ days: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'status_failed' });
  }
});

// Verify a payload against the anchored root (server builds tree for that day)
app.post('/api/verify', async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload required' });

    const ts = payload.timestamp ? new Date(payload.timestamp) : null;
    if (!ts) return res.status(400).json({ error: 'payload.timestamp required' });

    const dayKey = toDayKey(ts);

    // Load anchored root for that day
    const anchor = await Anchor.findOne({ dayKey }).lean();
    if (!anchor) return res.json({ consistent: false, reason: 'no_anchor_for_day' });

    // Build merkle root from stored leaf hashes for that day
    const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
    if (leaves.length === 0) return res.json({ consistent: false, reason: 'no_leaves_for_day' });

    const computedRoot = buildMerkleRoot(leaves.map(l => l.leafHash));

    // Recompute leaf for given payload
    const leaf = sha256Hex(canonicalStringify(payload));

    // Consistency means the leaf exists in the set & tree root matches anchor
    const leafExists = leaves.some(l => l.leafHash === leaf);
    const rootMatches = computedRoot === anchor.merkleRoot;

    const quorumMet = !!anchor.quorumMet;
    const validSigs = anchor.signatures?.length || 0;

    res.json({
      consistent: leafExists && rootMatches,
      quorumMet,
      validSigs,
      needed: parseInt(process.env.ANCHOR_QUORUM || '2', 10),
      anchorRoot: anchor.merkleRoot,
      computedRoot,
      dayKey
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'verify_failed' });
  }
});

// --- Cron: daily anchor of yesterday (runs every 5 minutes) ---
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    y.setUTCDate(y.getUTCDate() - 1);
    const dayKey = toDayKey(y);

    const exists = await Anchor.findOne({ dayKey }).lean();
    if (exists) return;

    const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
    if (leaves.length === 0) return;

    const root = buildMerkleRoot(leaves.map(l => l.leafHash));

    // Ask witnesses to sign
    const sigs = [];
    for (const url of WITNESS_URLS) {
      try {
        const resp = await httpPostJson(url, { dayKey, merkleRoot: root });
        if (resp && resp.signature && resp.publicKey) {
          sigs.push({ witnessUrl: url, publicKey: resp.publicKey, signature: resp.signature });
        }
      } catch (e) {
        console.warn('witness error', url, e.message);
      }
    }
    const quorumMet = sigs.length >= ANCHOR_QUORUM;

    await Anchor.create({ dayKey, merkleRoot: root, signatures: sigs, quorumMet });
    console.log(`[anchor] anchored ${dayKey} root=${root} sigs=${sigs.length}`);
  } catch (e) {
    console.error('anchor_cron_failed', e);
  }
});

// --- Cron: raw retention cleanup (runs nightly 02:00 UTC) ---
cron.schedule('0 2 * * *', async () => {
  try {
    if (RAW_RETENTION_DAYS <= 0) return;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - RAW_RETENTION_DAYS);
    const res = await Reading.deleteMany({ ts: { $lt: cutoff } });
    console.log(`[retention] removed ${res.deletedCount} old readings`);
  } catch (e) {
    console.error('retention_failed', e);
  }
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
