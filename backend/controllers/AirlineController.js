import Airline from '../models/Airline.js';

// Add new airline
export const addAirline = async (req, res) => {
  try {
    const { airlineName, contactNumber } = req.body;

    const existing = await Airline.findOne({ airlineName });
    if (existing) return res.status(400).json({ message: 'Airline already exists' });

    const airline = new Airline({ airlineName, contactNumber });
    await airline.save();

    res.status(201).json({ message: 'Airline added successfully', airline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all airlines
export const getAirlines = async (req, res) => {
  try {
    const airlines = await Airline.find();
    res.json(airlines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
