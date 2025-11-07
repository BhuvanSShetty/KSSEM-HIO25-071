// anchor.js — run once from backend project folder (node anchor.js)
import 'dotenv/config';
import mongoose from 'mongoose';
import http from 'http';
import { buildMerkleRoot } from './merkle.js';
import Reading from './models/Reading.js';
import Anchor from './models/Anchor.js';

const MONGO_URI = process.env.MONGO_URI;
const WITNESS_URLS = (process.env.WITNESS_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
await mongoose.connect(MONGO_URI);

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

async function run() {
  const dayKey = '2025-11-06';
  const leaves = await Reading.find({ dayKey }).select('leafHash').lean();
  console.log('found leaves', leaves.map(l=>l.leafHash));
  const root = buildMerkleRoot(leaves.map(l => l.leafHash));
  console.log('computed root', root);
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
  const quorumMet = sigs.length >= parseInt(process.env.ANCHOR_QUORUM||'2', 10);
  await Anchor.create({ dayKey, merkleRoot: root, signatures: sigs, quorumMet });
  console.log('Anchor created', { dayKey, root, sigsLength: sigs.length, quorumMet });
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(1); });
