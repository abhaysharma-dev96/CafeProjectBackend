import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  partySize: { type: mongoose.Schema.Types.Mixed, required: true }, // number or '5+'
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Reservation', reservationSchema);
