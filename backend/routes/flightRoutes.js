import express from "express";
import { addFlight, getFlights, searchFlights, deleteFlight , getAvailableDates , assignPilotToFlight} from "../controllers/FlightController.js"; // <-- ADDED deleteFlight
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Search route FIRST to avoid conflict with :id
router.get("/search", searchFlights);

// ✅ Get all flights
router.get("/", getFlights);

// ✅ Add new flight (protected for admin)
router.post("/", protect, adminOnly, addFlight);

// ✅ Admin deletes a flight
router.delete("/:id", protect, adminOnly, deleteFlight);

// Add this line in flightRoutes.js, preferably near the top
router.get("/available-dates", getAvailableDates); // GET /api/flights/available-dates

// PUT /api/flights/:flightId/assign-pilot
router.put("/:flightId/assign-pilot", protect, adminOnly, assignPilotToFlight); 

export default router;
