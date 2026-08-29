import express from 'express';
import { body } from 'express-validator';
import MenuItem from '../models/MenuItem.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const menuValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required.'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0.'),
  body('category').isIn(['Coffee', 'Tea', 'Snacks', 'Desserts']).withMessage('Invalid category.')
];

// Public — anyone browsing the menu page
router.get('/', async (req, res) => {
  const items = await MenuItem.find().sort({ category: 1, name: 1 });
  res.json(items);
});

// Admin only — add item
router.post('/', requireAuth(['admin']), menuValidation, validate, async (req, res) => {
  try {
    const { name, price, category, desc, tags, image } = req.body;
    const existing = await MenuItem.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) {
      return res.status(409).json({ message: 'An item with this name already exists.' });
    }
    const item = await MenuItem.create({ name, price, category, desc, tags, image });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Could not add item.' });
  }
});

// Admin only — edit item
router.put('/:id', requireAuth(['admin']), menuValidation, validate, async (req, res) => {
  try {
    const { name, price, category, desc, tags, image } = req.body;
    const duplicate = await MenuItem.findOne({ name: new RegExp(`^${name}$`, 'i'), _id: { $ne: req.params.id } });
    if (duplicate) return res.status(409).json({ message: 'An item with this name already exists.' });

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, price, category, desc, tags, image },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Could not update item.' });
  }
});

// Admin only — delete item
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
