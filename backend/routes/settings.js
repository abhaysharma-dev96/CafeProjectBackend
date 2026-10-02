import express from 'express';
import Settings from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const defaultSettings = {
  key: 'site',
  logoUrl: '',
  websiteName: 'Brew & Hearth',
  instagramUrl: 'https://instagram.com/brewandhearth',
  facebookUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  quickLinks: 'Home|/\nMenu|/menu\nAbout|/about\nGallery|/gallery\nReservations|/reservations',
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
      Object.entries(defaultSettings).filter(([field, value]) => (settings[field] === undefined || settings[field] === null) && value !== undefined)
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
    'logoUrl', 'websiteName', 'instagramUrl', 'facebookUrl', 'twitterUrl', 'linkedinUrl', 'quickLinks', 'whatsappNumber', 'whatsappEnabled',
    'whatsappMessage', 'shopOpenTime', 'shopCloseTime', 'contactNumber', 'email',
    'address', 'footerText', 'footerLinks', 'copyright'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] === undefined) continue;

    const value = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    updates[field] = field === 'logoUrl' && !value ? '' : value;
  }

  const settings = await Settings.findOneAndUpdate(
    { key: 'site' },
    { $set: updates, $setOnInsert: { key: 'site' } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(settings);
});

export default router;