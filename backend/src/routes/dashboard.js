// src/routes/dashboard.js
import express from 'express';
import FarmerDayAudit from '../models/FarmerDayAudit.js';
import User from '../models/User.js';
import { computeTrustScore } from '../utils.js';

export const router = express.Router();

// Get trust score + day status for logged-in farmer
router.get('/me', async (req, res) => {
  const farmerId = req.user._id;
  const records = await FarmerDayAudit.find({ farmerId }).sort({ dayKey: 1 }).lean();
  const trust = computeTrustScore(records);
  res.json({ farmerId, trustScore: trust, records });
});

// Admin: list all farmers with trust score
router.get('/farmers', async (req, res) => {
  const farmers = await User.find({ role: 'farmer' }).select('_id name email').lean();
  const out = [];
  for (const f of farmers) {
    const records = await FarmerDayAudit.find({ farmerId: f._id }).lean();
    const trust = computeTrustScore(records);
    out.push({ ...f, trustScore: trust });
  }
  res.json({ farmers: out });
});
