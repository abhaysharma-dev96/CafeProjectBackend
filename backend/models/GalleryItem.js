import mongoose from 'mongoose';

const galleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true, default: 'Interior' },
  image: { type: String, required: true } // http(s) URL or data URL
}, { timestamps: true });

export default mongoose.model('GalleryItem', galleryItemSchema);
