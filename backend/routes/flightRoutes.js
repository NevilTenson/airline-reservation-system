import express from 'express';
import { addFlight, getAllFlights, searchFlights } from '../controllers/FlightController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin-only route to add flight
router.post('/add', protect, adminOnly, addFlight);

// Get all flights
router.get('/', getAllFlights);

// Search flights
router.get('/search', searchFlights);

export default router;
