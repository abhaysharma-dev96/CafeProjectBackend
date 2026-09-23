import express from 'express';
import Settings from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth(['admin']), async (req, res) => {
  const settings = await Settings.findOneAndUpdate(
    { key: 'site' },
    { $setOnInsert: { key: 'site' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(settings);
});

router.put('/', requireAuth(['admin']), async (req, res) => {
  const allowedFields = [
    'logoUrl', 'websiteName', 'instagramUrl', 'whatsappNumber', 'whatsappEnabled',
    'whatsappMessage', 'shopOpenTime', 'shopCloseTime', 'contactNumber', 'email',
    'address', 'footerText', 'footerLinks', 'copyright'
  ];
  const updates = Object.fromEntries(
    allowedFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
  );

  const settings = await Settings.findOneAndUpdate(
    { key: 'site' },
    { $set: updates, $setOnInsert: { key: 'site' } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(settings);
});

export default router;