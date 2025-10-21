import mongoose from 'mongoose';

const airlineSchema = new mongoose.Schema({
  airlineName: { type: String, required: true },
  contactNumber: { type: String },
}, { timestamps: true });

export default mongoose.model('Airline', airlineSchema);
