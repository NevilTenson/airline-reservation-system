import express from "express";
import { addAirport, getAirports, deleteAirport } from "../controllers/AirportController.js"; // <-- ADDED deleteAirport
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/airports/  (Admin adds a new airport)
router.post("/", protect, adminOnly, addAirport);

// DELETE /api/airports/:airport_code (Admin deletes an airport)
router.delete("/:airport_code", protect, adminOnly, deleteAirport);

// GET /api/airports/  (Anyone can get all airports)
router.get("/", getAirports);

export default router;
