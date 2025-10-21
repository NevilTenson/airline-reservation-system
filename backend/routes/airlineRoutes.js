import express from "express";
import { addAirline, getAirlines } from "../controllers/AirlineController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admin can add airline
router.post("/", protect, adminOnly, addAirline);

// Everyone can view airlines
router.get("/", getAirlines);


export default router;