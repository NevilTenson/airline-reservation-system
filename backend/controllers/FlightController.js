import Flight from '../models/Flight.js';
import Airline from '../models/Airline.js';

// Add a new flight
export const addFlight = async (req, res) => {
  try {
    const { flightNumber, flightName, source, destination, arrivalTime, departureTime, seatAvailability, distance, airlineId } = req.body;

    // Check if flight number already exists
    const existingFlight = await Flight.findOne({ flightNumber });
    if (existingFlight) return res.status(400).json({ message: 'Flight already exists' });

    // Create flight
    const flight = new Flight({
      flightNumber,
      flightName,
      source,
      destination,
      arrivalTime,
      departureTime,
      seatAvailability,
      distance,
      airlineId
    });

    await flight.save();
    res.status(201).json({ message: 'Flight added successfully', flight });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all flights
export const getAllFlights = async (req, res) => {
  try {
    const flights = await Flight.find().populate('airlineId', 'airlineName contactNumber');
    res.json(flights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get flights by source and destination
export const searchFlights = async (req, res) => {
  try {
    const { source, destination } = req.query;

    const flights = await Flight.find({
      source: { $regex: source, $options: 'i' },
      destination: { $regex: destination, $options: 'i' }
    }).populate('airlineId', 'airlineName contactNumber');

    res.json(flights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
