// controllers/FlightController.js
import Flight from "../models/Flight.js";
import Airline from "../models/Airline.js";
import Airport from "../models/Airport.js"; // <-- Import Airport
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

// Search flights by origin, destination, and date
export const searchFlights = async (req, res) => {
  try {
    // 6. UPDATED: Search by origin_code and destination_code
    const { origin_code, destination_code, departureDate } = req.query;

    const flights = await Flight.findAll({
      where: {
        ...(origin_code && { origin_code }), // <-- CHANGED
        ...(destination_code && { destination_code }), // <-- CHANGED
        ...(departureDate && {
          departureTime: {
            [Op.gte]: new Date(departureDate),
            [Op.lt]:
              new Date(new Date(departureDate).getTime() + 24 * 60 * 60 * 1000),
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