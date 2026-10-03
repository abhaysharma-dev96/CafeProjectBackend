import express from 'express';
import { body } from 'express-validator';
import GalleryItem from '../models/GalleryItem.js';
import Settings from '../models/Settings.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { imageSrc, sendDataUrlImage } from '../utils/dataUrl.js';

const router = express.Router();

const CATEGORIES = ['Interior', 'Food & Drink', 'Events'];

// Starter photos, added once the first time the gallery is opened (never again after that)
const defaultItems = [
  { category: 'Interior', title: 'Our Sun-Drenched Nook', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI7oEHudfULsJoieesJs6XeeLdXOjBKdrfqHJZ9NHpmckWVjxeP4pIuYE6-HjFNdumSACCzbLyt9lubnkPR8Lmorj0eXZ2X2gDTmL6C1IbySanM7_mYBb1JLgb_mq-1qZERPIDbM' },
  { category: 'Food & Drink', title: 'Morning Latte Ritual', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi7yrbwtJvlnuLaNg-qgm1RAf04gBe-JJADogqsy-QBbk-O4iNRTzrtSSLqSfrdlanwf6b4zU_H5d2AlD-K8B1Rwtx0NGftTFHz_CAoSRA5yr0ZP5rHEJMybYaFwNgftVRkz3lry' },
  { category: 'Interior', title: 'The Reading Lounge', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5nkanXUSbxTGjJ91tMEn2u0Kljb80wLuBTzuJu3fIgagdSDkha2jefhIuNvQJh9D-Xo5EnSMWbRRPh5mzJzfwXYyjOXiw_FsYzK-8UaiwfoZ2lY0qB3b6tbUdHu4LpcplOZraxg' },
  { category: 'Events', title: 'Evening Tasting Series', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9Ja8v01vdN6CD526WjvGeQRkHsI98EOZYqP89es0RzvVcRjGjMl2BgIrxMAXAA4FrbofV653TrLgdS2x4HNdfEiwmmMJLrBRgayW6MwL931iw6Zp1gedFCrHnGhUeAlAOMa8Mq_' },
  { category: 'Food & Drink', title: 'Artisan Avocado Toast', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqmA0zyIvaO-4_OkGanPN1tJ9sKBkxVWLt0cCIizpJX9sZPbHjF8CnXg7BiBR4qP-QXiQa_6V9fLu6hDhBz8wp9CsZ7LA9R5TzIQBobyF2sX5rvPEymUJW6SrFDyWLb_ONgZcm31' },
  { category: 'Interior', title: 'The Hearth Station', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCM_giIUxjjyHqcnjcGDGpyAKMuZBlUK8NvbtOqNDI4kOZ4G9td-1MQdhhVK_nnoECrm7hVYB4aJzWWwivsbvsEgc-wDi5o7izZTmMqDnwHekrbKEblbSXa47L7I1emiDyeLnb0Rr' }
];

let seeding = null;
const ensureDefaults = () => {
  if (!seeding) {
    seeding = (async () => {
      let settings = await Settings.findOne();
      if (settings?.galleryInitialized) return;
      if ((await GalleryItem.countDocuments()) === 0) await GalleryItem.insertMany(defaultItems);
      if (!settings) settings = new Settings();
      settings.galleryInitialized = true;
      await settings.save();
    })().catch((err) => { seeding = null; throw err; });
  }
  return seeding;
};

const toPublic = (item) => ({
  _id: item._id,
  title: item.title,
  category: item.category,
  image: imageSrc(item.image, `/api/gallery/${item._id}/image`, item.updatedAt)
});

const galleryValidation = [
  body('title').trim().isLength({ min: 2, max: 80 }).withMessage('Title should be 2 to 80 characters.'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category.')
];

// Public — gallery page
router.get('/', async (req, res) => {
  await ensureDefaults();
  const items = await GalleryItem.find().sort({ createdAt: 1 });
  res.json(items.map(toPublic));
});

// Public — serves an uploaded image as a normal image file
router.get('/:id/image', async (req, res) => {
  const item = await GalleryItem.findById(req.params.id).select('image');
  if (!item) return res.status(404).end();
  return sendDataUrlImage(res, item.image);
});

router.post('/', requireAuth(['admin']), galleryValidation, body('image').notEmpty().withMessage('Image is required.'), validate, async (req, res) => {
  const { title, category, image } = req.body;
  const item = await GalleryItem.create({ title, category, image });
  res.status(201).json(toPublic(item));
});

// image is optional on edit: if it isn't sent, the old image is kept
router.put('/:id', requireAuth(['admin']), galleryValidation, validate, async (req, res) => {
  const update = { title: req.body.title, category: req.body.category };
  if (req.body.image) update.image = req.body.image;
  const item = await GalleryItem.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!item) return res.status(404).json({ message: 'Gallery item not found.' });
  res.json(toPublic(item));
});

router.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const item = await GalleryItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Gallery item not found.' });
  res.json({ message: 'Deleted.' });
});

export default router;
