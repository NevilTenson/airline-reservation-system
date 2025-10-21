import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  classType: { type: String, required: true }, // e.g., Economy, Business
  fare: { type: Number, required: true },
  flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true }
}, { timestamps: true });

export default mongoose.model('Class', classSchema);
