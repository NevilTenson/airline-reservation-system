import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  PNR: { type: String, required: true, unique: true },
  seatNumber: { type: String },
  source: { type: String },
  destination: { type: String },
  passengerName: { type: String, required: true },
  flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);
