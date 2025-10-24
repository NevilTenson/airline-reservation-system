import express from "express";
import { registerUser, loginUser, getAllUsers } from "../controllers/userController.js";
import { getMyBookings } from "../controllers/TicketController.js"; // <-- Import this
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

    router.post("/register", registerUser);
    router.post("/login", loginUser);
    router.get("/", getAllUsers); // optional, admin only in future
    router.get("/my-bookings", protect, getMyBookings); // GET /api/users/my-bookings
export default router;