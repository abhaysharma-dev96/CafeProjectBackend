import express from 'express';
import { body } from 'express-validator';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const messageValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Please enter a valid name.')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Name should contain letters only.'),
  body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
  body('subject').notEmpty().withMessage('Please select a subject.'),
  body('message').trim().isLength({ min: 10 }).withMessage('Message should be at least 10 characters.')
];

// Public — customer submits the contact form
router.post('/', messageValidation, validate, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const saved = await Message.create({ name, email, subject, message });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Could not save message.' });
  }
});

// Admin only
router.get('/', requireAuth(['admin']), async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

router.patch('/:id/read', requireAuth(['admin']), async (req, res) => {
  const message = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  if (!message) return res.status(404).json({ message: 'Message not found.' });
  res.json(message);
});

router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.id);
  if (!message) return res.status(404).json({ message: 'Message not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
