import express from 'express';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';


const router = express.Router();


// Farmer/Admin registration (admin can create admin by role field)
router.post('/register', async (req, res) => {
try {
const { name, email, password, role } = req.body;
if (!name || !email || !password) return res.status(400).json({ error: 'name_email_password_required' });
const exists = await User.findOne({ email });
if (exists) return res.status(409).json({ error: 'email_in_use' });
const u = new User({ name, email, role: role === 'admin' ? 'admin' : 'farmer' });
await u.setPassword(password);
await u.save();
const token = signToken(u);
res.json({ token, user: { id: u._id, name: u.name, email: u.email, role: u.role } });
} catch (e) {
console.error(e); res.status(500).json({ error: 'register_failed' });
}
});


// Login
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const u = await User.findOne({ email });
if (!u) return res.status(401).json({ error: 'invalid_credentials' });
const ok = await u.comparePassword(password);
if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
const token = signToken(u);
res.json({ token, user: { id: u._id, name: u.name, email: u.email, role: u.role } });
} catch (e) { console.error(e); res.status(500).json({ error: 'login_failed' }); }
});


export default router;