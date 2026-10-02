import express from 'express';
import { body } from 'express-validator';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Table from '../models/Table.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const orderValidation = [
  body('table').notEmpty().withMessage('Table is required.'),
  body('items').isArray({ min: 1, max: 50 }).withMessage('Order must contain at least one item.'),
  body('items.*.name').isString().notEmpty().withMessage('Invalid item in order.'),
  body('items.*.qty').isInt({ min: 1, max: 50 }).withMessage('Item quantity must be between 1 and 50.').toInt()
];

// Public — customer places an order after scanning a table's QR code
router.post('/', orderValidation, validate, async (req, res) => {
  try {
    const { table, items } = req.body;

    // The table must be a real table
    const tableExists = await Table.exists({ label: String(table) });
    if (!tableExists) {
      return res.status(400).json({ message: 'Invalid table. Please scan the QR code on your table again.' });
    }

    // Prices and total are ALWAYS calculated on the server from the real menu,
    // so a customer can't send a fake/lower total from the browser.
    const names = [...new Set(items.map((i) => i.name))];
    const menuItems = await MenuItem.find({ name: { $in: names } });
    const priceByName = new Map(menuItems.map((m) => [m.name, m.price]));

    if (names.some((n) => !priceByName.has(n))) {
      return res.status(400).json({ message: 'Some items in your cart are no longer available. Please refresh the menu.' });
    }

    const orderItems = items.map((i) => ({ name: i.name, qty: i.qty, price: priceByName.get(i.name) }));
    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = await Order.create({ table: String(table), items: orderItems, total });
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
