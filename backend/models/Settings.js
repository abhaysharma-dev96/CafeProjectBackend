import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'site' },
  logoUrl: { type: String, default: '' },
  websiteName: { type: String, default: 'Brew & Hearth' },
  instagramUrl: { type: String, default: 'https://instagram.com/brewandhearth' },
  facebookUrl: { type: String, default: '' },
  twitterUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  quickLinks: { type: String, default: 'Home|/\nMenu|/menu\nAbout|/about\nGallery|/gallery\nReservations|/reservations' },
  whatsappNumber: { type: String, default: '+15551234567' },
  whatsappEnabled: { type: Boolean, default: true },
  whatsappMessage: { type: String, default: 'Hello, I would like to know more about Brew & Hearth.' },
  shopOpenTime: { type: String, default: '08:00 AM' },
  shopCloseTime: { type: String, default: '08:00 PM' },
  contactNumber: { type: String, default: '+1 (555) 123-4567' },
  email: { type: String, default: 'hello@brewandhearth.com' },
  address: { type: String, default: '123 Artisan Alley, Portland, OR 97209' },
  footerText: { type: String, default: 'A space for mindful consumption and deliberate pauses.' },
  footerLinks: { type: String, default: 'Careers | Privacy Policy | Terms of Service' },
  copyright: { type: String, default: '© 2024 Brew & Hearth. All Rights Reserved.' }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);