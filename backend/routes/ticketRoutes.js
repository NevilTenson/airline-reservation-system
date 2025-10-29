import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import {
  createBooking, 
  getBookingByPNR, 
  cancelBooking, 
  ADMIN_getAllTickets,
  deleteTicket // <-- ADDED
} from "../controllers/TicketController.js";

const router = express.Router();

// 🎟 Book a flight (create a booking for the logged-in user)
// POST /api/tickets/book
router.post("/book", protect, createBooking);

// 🔍 Get a specific booking by its PNR
// GET /api/tickets/pnr/PNR123...
router.get("/pnr/:pnr", protect, getBookingByPNR);

// ❌ Cancel an entire booking by its PNR
// DELETE /api/tickets/pnr/PNR123...
router.delete("/pnr/:pnr", protect, cancelBooking);

// 👑 ADMIN: Get *all* tickets (for the admin dashboard)
// GET /api/tickets/
router.get("/", protect, adminOnly, ADMIN_getAllTickets);

// --- NEW ROUTE ---
// 👑 ADMIN: Delete a single ticket by its ID
// DELETE /api/tickets/123
router.delete("/:id", protect, adminOnly, deleteTicket); // <-- ADDED

export default router;
