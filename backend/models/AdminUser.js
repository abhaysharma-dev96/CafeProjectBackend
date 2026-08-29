import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // stored hashed, never plain text
  role: { type: String, enum: ['admin', 'kitchen'], required: true }
}, { timestamps: true });

export default mongoose.model('AdminUser', adminUserSchema);
