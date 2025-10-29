import Airport from "../models/Airport.js"; // <-- CORRECTED

// ✈️ Add a new Airport (Admin only)
export const addAirport = async (req, res) => {
  try {
    const { airport_code, name, city, country } = req.body;
    if (!airport_code || !name || !city || !country) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if code already exists (must be unique)
    const code = airport_code.toUpperCase();
    const existing = await Airport.findByPk(code);
    if (existing) {
      return res.status(400).json({ message: "Airport code already exists" });
    }

    const newAirport = await Airport.create({
      airport_code: code,
      name,
      city,
      country,
    });
    res.status(201).json({ message: "Airport added", airport: newAirport });
  } catch (err) {
    console.error("❌ Error adding airport:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const deleteAirport = async (req, res) => {
  try {
    const airport = await Airport.findByPk(req.params.airport_code);
    if (!airport) {
        return res.status(404).json({ message: "Airport not found" });
    }
    await airport.destroy();
    res.json({ message: "Airport removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✈️ Get all Airports
export const getAirports = async (req, res) => {
  try {
    const airports = await Airport.findAll({
      order: [["city", "ASC"]], // Order alphabetically
    });
    res.json(airports);
  } catch (err) {
    console.error("❌ Error fetching airports:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

