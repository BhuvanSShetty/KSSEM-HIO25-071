import mongoose from 'mongoose';

const SignatureSchema = new mongoose.Schema({
  witnessUrl: String,
  publicKey: String,       // base64
  signature: String        // base64
}, { _id: false });

const AnchorSchema = new mongoose.Schema({
  dayKey: { type: String, unique: true, index: true }, // e.g., 2025-11-06
  merkleRoot: { type: String, required: true },
  signatures: [SignatureSchema],
  quorumMet: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Anchor', AnchorSchema);
