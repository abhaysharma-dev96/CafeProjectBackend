import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0.01 },
  category: { type: String, enum: ['Coffee', 'Tea', 'Snacks', 'Desserts'], required: true },
  desc: { type: String, default: '' },
  tags: { type: [String], default: [] },
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('MenuItem', menuItemSchema);
