import Flight from "../models/Flight.js"; // <-- CORRECTED
import Airline from "../models/Airline.js"; // <-- CORRECTED
import Airport from "../models/Airport.js"; // <-- CORRECTED
import { Op } from "sequelize";

// Add new flight (Admin only)
export const addFlight = async (req, res) => {
  try {
    // 1. UPDATED: Get origin_code and destination_code
    const {
      flightNumber,
      origin_code, // <-- CHANGED
      destination_code, // <-- CHANGED
      departureTime,
      arrivalTime,
      price,
      airline_id, // <-- CHANGED from airlineId
    } = req.body;

    // 2. Validate codes
    if (!origin_code || !destination_code) {
      return res.status(400).json({ message: "Origin and Destination are required." });
    }
    if (origin_code === destination_code) {
      return res.status(400).json({ message: "Origin and Destination cannot be the same." });
    }

    const existing = await Flight.findOne({ where: { flightNumber } });
    if (existing)
      return res.status(400).json({ message: "Flight already exists" });

    const airline = await Airline.findByPk(airline_id);
    if (!airline) return res.status(404).json({ message: "Airline not found" });

    // 3. Check if airports exist
    const originAirport = await Airport.findByPk(origin_code);
    const destAirport = await Airport.findByPk(destination_code);
    if (!originAirport || !destAirport) {
      return res.status(404).json({ message: "Invalid Origin or Destination Airport" });
    }

    // 4. UPDATED: Create flight with new codes
    const flight = await Flight.create({
      flightNumber,
      origin_code, // <-- CHANGED
      destination_code, // <-- CHANGED
      departureTime,
      arrivalTime,
      price,
      airline_id: airline_id,
    });

    res.status(201).json({ message: "Flight added successfully", flight });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) {
        return res.status(404).json({ message: "Flight not found" });
    }
    await flight.destroy();
    res.json({ message: "Flight removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all flights
export const getFlights = async (req, res) => {
  try {
    const flights = await Flight.findAll({
      // 5. UPDATED: Include Airline AND Airport data
      include: [
        { model: Airline, attributes: ["name", "code", "country"] },
        { model: Airport, as: "Origin" }, // Use alias from Flight.js
        { model: Airport, as: "Destination" }, // Use alias from Flight.js
      ],
    });
    res.json(flights);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAvailableDates = async (req, res) => {
  try {
    const { origin_code, destination_code } = req.query;

    if (!origin_code || !destination_code) {
      return res.status(400).json({ message: "Origin and Destination codes are required." });
    }

    // Find all flights matching the route
    const flights = await Flight.findAll({
      where: {
        origin_code: origin_code,
        destination_code: destination_code,
        departureTime: {
          [Op.gte]: new Date() // Optional: Only show future dates
        }
      },
      attributes: [
        // Select only the departureTime
        'departureTime'
      ],
      order: [['departureTime', 'ASC']]
    });

    // Extract unique dates (YYYY-MM-DD format)
    const availableDates = [...new Set(
      flights.map(flight => flight.departureTime.toISOString().split('T')[0])
    )];

    res.json(availableDates);

  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ message: "Server error fetching dates" });
  }
};

// Search flights by origin, destination, and date
export const searchFlights = async (req, res) => {
  try {
    // 6. UPDATED: Search by origin_code and destination_code
    const { origin_code, destination_code, departureDate } = req.query; // Match frontend & API standard

    const flights = await Flight.findAll({
     where: {
        ...(origin_code && { origin_code: origin_code }), // Use correct variable
        ...(destination_code && { destination_code: destination_code }), // Use correct variable
        ...(departureDate && { // Use correct variable
          departureTime: {
            [Op.gte]: new Date(departureDate), // Start of the day
            [Op.lt]: new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000), // Start of the next day
          },
        }),
      },
      // 7. UPDATED: Include associations in search results too
      include: [
        { model: Airline, attributes: ["name", "code"] },
        { model: Airport, as: "Origin" },
        { model: Airport, as: "Destination" },
      ],
    });

    res.json(flights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this function inside FlightController.js
export const assignPilotToFlight = async (req, res) => {
  try {
    const { flightId } = req.params; // Get flight ID from URL parameter
    const { pilotId } = req.body; // Get pilot ID from request body

    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found." });
    }

    // Find the user to ensure they exist and have the 'pilot' role
    const pilotUser = await User.findOne({ where: { id: pilotId, role: 'pilot' } });
    if (!pilotUser) {
      return res.status(404).json({ message: "Pilot user not found or user is not a pilot." });
    }

    // Assign the pilot
    flight.pilotId = pilotId;
    await flight.save();

    res.json({ message: `Pilot ${pilotUser.name} assigned to flight ${flight.flightNumber}.`, flight });

  } catch (error) {
    console.error("❌ Error assigning pilot:", error);
    res.status(500).json({ message: "Server error assigning pilot.", error: error.message });
  }
};

