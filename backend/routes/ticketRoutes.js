// routes/ticketRoutes.js
import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js"; // Make sure middleware is imported
import {
  createBooking,      // Correct function name
  getBookingByPNR,    // Correct function name
  cancelBooking,      // Correct function name
  ADMIN_getAllTickets,// Correct function name for the admin route
} from "../controllers/TicketController.js";

const router = express.Router();

// 🎟 Book a flight (create a booking for the logged-in user)
// POST /api/tickets/book
router.post("/book", protect, createBooking);

// 🔍 Get a specific booking by its PNR
// GET /api/tickets/pnr/PNR123...
router.get("/pnr/:pnr", protect, getBookingByPNR);

// ❌ Cancel an entire booking by its PNR
// DELETE /api/tickets/pnr/PNR123... (Using DELETE is more standard for cancellation)
router.delete("/pnr/:pnr", protect, cancelBooking);

// 👑 ADMIN: Get *all* tickets (for the admin dashboard)
// GET /api/tickets/
router.get("/", protect, adminOnly, ADMIN_getAllTickets);

export default router;