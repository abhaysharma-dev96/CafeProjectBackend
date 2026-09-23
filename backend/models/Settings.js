import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'site' },
  logoUrl: { type: String, default: '' },
  websiteName: { type: String, default: 'Brew & Hearth' },
  instagramUrl: { type: String, default: '' },
  whatsappNumber: { type: String, default: '' },
  whatsappEnabled: { type: Boolean, default: true },
  whatsappMessage: { type: String, default: 'Hello, I would like to know more about Brew & Hearth.' },
  shopOpenTime: { type: String, default: '08:00 AM' },
  shopCloseTime: { type: String, default: '08:00 PM' },
  contactNumber: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  footerText: { type: String, default: '' },
  footerLinks: { type: String, default: '' },
  copyright: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);