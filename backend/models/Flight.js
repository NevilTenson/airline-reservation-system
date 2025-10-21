import mongoose from 'mongoose';

const flightSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, unique: true },
  flightName: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  arrivalTime: { type: String },
  departureTime: { type: String },
  seatAvailability: { type: Number, default: 0 },
  distance: { type: Number },
  airlineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true }
}, { timestamps: true });

export default mongoose.model('Flight', flightSchema);
