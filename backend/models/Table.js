import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true },
  customQrImage: { type: String, default: '' } // optional custom QR (URL or uploaded image)
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);
