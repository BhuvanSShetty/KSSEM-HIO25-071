import mongoose from 'mongoose';

const ReadingSchema = new mongoose.Schema({
  payload: { type: Object, required: true },       // raw IoT JSON
  leafHash: { type: String, required: true },      // sha256(payload canonical)
  ts: { type: Date, required: true, index: true }, // timestamp of reading
  dayKey: { type: String, index: true },           // YYYY-MM-DD (local/UTC normalize)
}, { timestamps: true });

export default mongoose.model('Reading', ReadingSchema);
