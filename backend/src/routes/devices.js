import express from 'express';
import Device from '../models/Device.js';


const router = express.Router();


// Add a device under logged-in farmer
router.post('/', async (req, res) => {
const { deviceId, label, meta } = req.body;
if (!deviceId) return res.status(400).json({ error: 'deviceId_required' });
try {
const d = await Device.create({ deviceId, label, meta, farmerId: req.user._id });
res.json({ ok: true, device: d });
} catch (e) {
if (e.code === 11000) return res.status(409).json({ error: 'device_exists' });
console.error(e); res.status(500).json({ error: 'device_create_failed' });
}
});


// List my devices
router.get('/', async (req, res) => {
const list = await Device.find({ farmerId: req.user._id }).lean();
res.json({ devices: list });
});


// Remove a device (hard delete)
router.delete('/:deviceId', async (req, res) => {
const { deviceId } = req.params;
await Device.deleteOne({ deviceId, farmerId: req.user._id });
res.json({ ok: true });
});


export default router;