import express from 'express';
import User from '../models/User.js';
import { verifyFarmerWindowSelectivePurge, verifyAllFarmersWindowSelectivePurge } from '../services/integrity.js';


const router = express.Router();


// List farmers
router.get('/farmers', async (_req, res) => {
const farmers = await User.find({ role: 'farmer' }).select('_id name email').lean();
res.json({ farmers });
});


// Run verification+selective purge for one farmer
router.post('/farmers/:farmerId/verify', async (req, res) => {
const { farmerId } = req.params;
const days = parseInt(req.query.windowDays || process.env.VERIFY_WINDOW_DAYS || '20', 10);
const report = await verifyFarmerWindowSelectivePurge({ farmerId, days });
res.json(report);
});


// Run for all
router.post('/verify-all', async (req, res) => {
const days = parseInt(req.query.windowDays || process.env.VERIFY_WINDOW_DAYS || '20', 10);
const out = await verifyAllFarmersWindowSelectivePurge({ days });
res.json(out);
});


export default router;