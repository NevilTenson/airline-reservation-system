// routes/airportRoutes.js
import express from "express";
import { addAirport, getAirports } from "../controllers/AirportController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/airports/  (Admin adds a new airport)
router.post("/", protect, adminOnly, addAirport);

// GET /api/airports/   (Anyone can get all airports)
router.get("/", getAirports);

export default router;