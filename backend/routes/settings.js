import express from 'express';
import Settings from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const defaultSettings = {
  key: 'site',
  websiteName: 'Brew & Hearth',
  instagramUrl: 'https://instagram.com/brewandhearth',
  whatsappNumber: '+15551234567',
  whatsappEnabled: true,
  whatsappMessage: 'Hello, I would like to know more about Brew & Hearth.',
  shopOpenTime: '08:00 AM',
  shopCloseTime: '08:00 PM',
  contactNumber: '+1 (555) 123-4567',
  email: 'hello@brewandhearth.com',
  address: '123 Artisan Alley, Portland, OR 97209',
  footerText: 'A space for mindful consumption and deliberate pauses.',
  footerLinks: 'Careers | Privacy Policy | Terms of Service',
  copyright: '© 2024 Brew & Hearth. All Rights Reserved.'
};

router.get('/', async (req, res) => {
  let settings = await Settings.findOne({ key: 'site' });
  if (!settings) {
    settings = await Settings.create(defaultSettings);
  } else {
    const missingFields = Object.fromEntries(
      Object.entries(defaultSettings).filter(([field, value]) => !settings[field] && value !== undefined)
    );
    if (Object.keys(missingFields).length > 0) {
      Object.assign(settings, missingFields);
      await settings.save();
    }
  }
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