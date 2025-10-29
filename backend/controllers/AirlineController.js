import Airline from '../models/Airline.js'; // <-- CORRECTED PATH

// Add new airline
export const addAirline = async (req, res) => {
  try {
    const { name, code, country } = req.body;

    // Check for duplicate code
    const existing = await Airline.findOne({ where: { code } });
    if (existing) return res.status(400).json({ message: 'Airline code already exists' });

    // Create airline
    const airline = await Airline.create({ name, code, country });

    res.status(201).json({ message: 'Airline added successfully', airline });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
export const deleteAirline = async (req, res) => {
  try {
    const airline = await Airline.findByPk(req.params.id);
    if (!airline) {
      return res.status(404).json({ message: "Airline not found" });
    }
    await airline.destroy();
    res.json({ message: "Airline removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all airlines
export const getAirlines = async (req, res) => {
  try {
    const airlines = await Airline.findAll();
    res.json(airlines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

