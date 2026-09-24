import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,       // JS on the frontend can never read this cookie — protects against XSS token theft
  secure: isProduction, // only sent over HTTPS — required for sameSite: 'none' to work
  // Frontend (Vercel) and backend (Render) live on different domains, which counts as
  // "cross-site" to the browser. sameSite must be 'none' in production for the cookie
  // to be sent on those cross-site API calls. Locally, frontend/backend are both on
  // localhost (same-site), where 'lax' works fine and doesn't require HTTPS.
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = await AdminUser.findOne({ username });
  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  res.cookie('bh_token', token, cookieOptions);
  res.json({ username: user.username, role: user.role });
});

router.patch('/password', requireAuth(['admin']), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }

  const user = await AdminUser.findOne({ username: req.user.username });
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ message: 'Current password is incorrect.' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: 'Password changed successfully.' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('bh_token', cookieOptions);
  res.json({ message: 'Logged out.' });
});

// Lets the frontend check "am I still logged in?" on page load, without exposing the token itself
router.get('/session', (req, res) => {
  const token = req.cookies?.bh_token;
  if (!token) return res.json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true, username: decoded.username, role: decoded.role });
  } catch {
    res.json({ authenticated: false });
  }
});

export default router;