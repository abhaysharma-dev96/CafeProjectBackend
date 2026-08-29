import express from 'express';
import { body } from 'express-validator';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const orderValidation = [
  body('table').notEmpty().withMessage('Table is required.'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
  body('total').isFloat({ gt: 0 }).withMessage('Order total must be greater than 0.')
];

// Public — customer places an order after scanning a table's QR code
router.post('/', orderValidation, validate, async (req, res) => {
  try {
    const { table, items, total } = req.body;
    const order = await Order.create({ table, items, total });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Could not place order.' });
  }
});

// Admin AND kitchen — both need to see the live order board
router.get('/', requireAuth(['admin', 'kitchen']), async (req, res) => {
  const { table } = req.query;
  const filter = table ? { table } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
});

// Admin AND kitchen — update prep status
router.patch('/:id/status', requireAuth(['admin', 'kitchen']), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'preparing', 'ready', 'delivered'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
});

// Admin ONLY — mark paid (kitchen staff should not handle billing)
router.patch('/:id/paid', requireAuth(['admin']), async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { paid: true }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
});

// Admin only — delete
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
