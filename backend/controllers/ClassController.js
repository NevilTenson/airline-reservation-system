// controllers/ClassController.js
import ClassModel from "../models/Class.js";
import Flight from "../models/Flight.js";
import Airport from "../models/Airport.js"; // Import Airport

// ✈️ Add a new class (Business/Economy)
export const addClass = async (req, res) => {
  try {
    console.log("🔹 Incoming request body:", req.body);

    const { classType, fare, flightId, total_seats } = req.body;

    if (!classType || !fare || !flightId || !total_seats) {
      return res
        .status(400)
        .json({
          message: "classType, fare, flightId, and total_seats are required",
        });
    }
    // Basic validation for seats
    if (Number(total_seats) <= 0) {
        return res.status(400).json({ message: "Total seats must be positive." });
    }

    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      console.log(`❌ Flight with ID ${flightId} not found`);
      return res.status(404).json({ message: "Flight not found" });
    }

    // Optional: Check if class type already exists for this flight
    const existingClass = await ClassModel.findOne({ where: { flight_id: flightId, classType: classType } });
    if (existingClass) {
        return res.status(400).json({ message: `${classType} class already exists for this flight.` });
    }

    const newClass = await ClassModel.create({
      classType,
      fare,
      total_seats,
      flight_id: flightId,
    });

    console.log("✅ New class created:", newClass.toJSON());

    res.status(201).json({
      message: "Class added successfully",
      newClass,
    });
  } catch (err) {
    console.error("❌ Error adding class:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✈️ Get all classes (THIS WAS MISSING)
export const getClasses = async (req, res) => {
  try {
    console.log("🔹 Fetching classes with Flight and Airport info");

    const classes = await ClassModel.findAll({
      include: [
        {
          model: Flight,
          attributes: ["id", "flightNumber", "departureTime", "arrivalTime"], // Include relevant Flight attributes
          required: true,
          include: [ // Include Airport details within Flight
            { model: Airport, as: 'Origin', attributes: ['city', 'airport_code'] },
            { model: Airport, as: 'Destination', attributes: ['city', 'airport_code'] }
          ]
        },
      ],
      order: [ // Optional: Order by flight then class type
        ['flight_id', 'ASC'],
        ['classType', 'ASC']
      ]
    });

    console.log("🔹 Classes found:", classes.length);
    res.json(classes);
  } catch (err) {
    console.error("❌ Error fetching classes:", err);
    res.status(500).json({ error: err.message });
  }
};