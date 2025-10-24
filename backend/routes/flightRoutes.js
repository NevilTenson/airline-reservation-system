import express from "express";
import { addFlight, getFlights, searchFlights } from "../controllers/FlightController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ✅ Search route FIRST to avoid conflict with :id
router.get("/search", searchFlights);

// ✅ Get all flights
router.get("/", getFlights);

// ✅ Add new flight (protected for admin)
router.post("/", protect, adminOnly, addFlight);

export default router;
