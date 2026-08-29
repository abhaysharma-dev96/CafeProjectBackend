import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);
