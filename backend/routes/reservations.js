import express from 'express';
import { body } from 'express-validator';
import Reservation from '../models/Reservation.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const reservationValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Please enter a valid name.')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Name should contain letters only.'),
  body('date').notEmpty().withMessage('Date is required.'),
  body('time').notEmpty().withMessage('Time is required.'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be under 500 characters.')
];

// Public — customer submits a reservation from the website
router.post('/', reservationValidation, validate, async (req, res) => {
  try {
    const { name, date, time, partySize, notes } = req.body;
    const reservation = await Reservation.create({ name, date, time, partySize, notes });
    res.status(201).json(reservation);
  } catch (err) {
    res.status(500).json({ message: 'Could not save reservation.' });
  }
});

// Admin only — view all reservations
router.get('/', requireAuth(['admin']), async (req, res) => {
  const reservations = await Reservation.find().sort({ createdAt: -1 });
  res.json(reservations);
});

// Admin only — confirm/cancel
router.patch('/:id/status', requireAuth(['admin']), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });
  res.json(reservation);
});

// Admin only — delete
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation) return res.status(404).json({ message: 'Reservation not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
