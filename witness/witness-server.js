import 'dotenv/config';
import express from 'express';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';   // ✅ FIXED IMPORT

const { encodeBase64, decodeUTF8 } = naclUtil;

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 6001;
const seedHex = (process.env.ED25519_SEED_HEX || '').toLowerCase();

if (!/^[0-9a-f]{64}$/.test(seedHex)) {
  console.error('Invalid ED25519_SEED_HEX (need 32-byte hex).');
  process.exit(1);
}

const seed = new Uint8Array(seedHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
const keyPair = nacl.sign.keyPair.fromSeed(seed);
const publicKeyB64 = encodeBase64(keyPair.publicKey);

// POST /sign { dayKey, merkleRoot }
app.post('/', (req, res) => {
  const { dayKey, merkleRoot } = req.body || {};
  if (!dayKey || !merkleRoot) return res.status(400).json({ error: 'dayKey and merkleRoot required' });

  const msg = decodeUTF8(`${dayKey}:${merkleRoot}`);
  const sig = nacl.sign.detached(msg, keyPair.secretKey);
  const signatureB64 = encodeBase64(sig);

  res.json({ signature: signatureB64, publicKey: publicKeyB64, dayKey, merkleRoot });
});

app.listen(PORT, () => {
  console.log(`✅ Witness running on http://localhost:${PORT}`);
  console.log(`🔑 PublicKey (base64): ${publicKeyB64}`);
});
