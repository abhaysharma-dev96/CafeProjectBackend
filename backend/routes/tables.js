import express from 'express';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public — QR codes and menu page need to know valid table labels
router.get('/', async (req, res) => {
  const tables = await Table.find().sort({ label: 1 });

  // attach live occupied/available status based on unpaid orders
  const withStatus = await Promise.all(
    tables.map(async (t) => {
      const hasUnpaid = await Order.exists({ table: t.label, paid: false });
      return { ...t.toObject(), status: hasUnpaid ? 'occupied' : 'available' };
    })
  );
  res.json(withStatus);
});

// Admin only — add table
router.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const { label } = req.body;
    if (!label) return res.status(400).json({ message: 'Table label is required.' });
    const existing = await Table.findOne({ label });
    if (existing) return res.status(409).json({ message: 'That table already exists.' });
    const table = await Table.create({ label });
    res.status(201).json(table);
  } catch (err) {
    res.status(500).json({ message: 'Could not add table.' });
  }
});

// Admin only — remove table
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) return res.status(404).json({ message: 'Table not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
