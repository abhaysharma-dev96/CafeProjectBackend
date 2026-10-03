import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import './middleware/asyncSafe.js'; // must load before the route files below

import authRoutes from './routes/auth.js';
import reservationRoutes from './routes/reservations.js';
import messageRoutes from './routes/messages.js';
import menuRoutes from './routes/menu.js';
import tableRoutes from './routes/tables.js';
import orderRoutes from './routes/orders.js';
import settingsRoutes from './routes/settings.js';
import reviewRoutes from './routes/reviews.js';

const app = express();

connectDB();
// Vercel (rewrite) -> Render proxy -> Express: 2 proxy hops. With 1, every visitor
// looked like the same IP (Vercel's), so ALL users shared one rate-limit bucket -> 429.
app.set('trust proxy', 2);

// Security headers (protects against clickjacking, MIME-sniffing, etc.)
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true // required so the browser sends/receives the httpOnly cookie
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Real visitor IP. The site reaches this server through Vercel's /api rewrite, which puts the
// visitor's IP first in x-forwarded-for. Counting by that IP gives every visitor their own
// bucket, instead of everyone sharing the proxy's address (the cause of the repeated 429s).
const clientKey = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  return first || req.ip;
};

// General rate limit — protects the whole API from being hammered
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  keyGenerator: clientKey,
  skip: (req) => req.path === '/health',
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' }
});
app.use('/api', generalLimiter);

// Stricter limit just for login — keep it tight in production, but avoid blocking
// normal local development/testing with repeated legitimate retries.
const isProduction = process.env.NODE_ENV === 'production';
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 100,
  keyGenerator: clientKey,
  skipSuccessfulRequests: true, // only failed logins count
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: isProduction
      ? 'Too many login attempts. Please try again in 15 minutes.'
      : 'Too many login attempts. Please wait a moment and try again.'
  }
});
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Catch-all error handler — prevents raw stack traces from leaking to the client
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our end. Please try again.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
