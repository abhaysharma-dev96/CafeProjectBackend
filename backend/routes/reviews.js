import express from 'express';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import Review from '../models/Review.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Stops one person from spamming reviews (5 per hour per visitor)
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reviews submitted. Please try again later.' }
});

const reviewValidation = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Please enter your name.')
    .matches(/^[A-Za-z\s'.-]+$/).withMessage('Name should contain letters only.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Please select a rating from 1 to 5.').toInt(),
  body('comment').trim().isLength({ min: 10, max: 5000 }).withMessage('Review should be at least 10 characters.')
];

// Public — only APPROVED reviews are ever visible on the website
router.get('/', async (req, res) => {
  const reviews = await Review.find({ status: 'approved' })
    .select('name rating comment createdAt')
    .sort({ createdAt: -1 })
    .limit(30);
  res.json(reviews);
});

// Public — customer submits a review; it stays "pending" until admin approves
router.post('/', submitLimiter, reviewValidation, validate, async (req, res) => {
  try {
    const { name, rating, comment } = req.body;
    await Review.create({ name, rating, comment });
    res.status(201).json({ message: 'Thank you! Your review will appear after approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not save review.' });
  }
});

// Admin only — all reviews (pending, approved, rejected)
router.get('/all', requireAuth(['admin']), async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
});

router.patch('/:id/status', requireAuth(['admin']), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  res.json(review);
});

router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
