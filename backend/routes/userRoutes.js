import express from "express";
import { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  deleteUser,  // <-- ADDED
  updateUserProfile ,
  getMyAssignedFlights // <-- ADDED (for profile.js)
} from "../controllers/userController.js"; 
import { getMyBookings } from "../controllers/TicketController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js"; // <-- ADDED adminOnly
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Route for admin to get all users
router.get("/", protect, adminOnly, getAllUsers); // <-- SECURED

// Route for logged-in user to get their own bookings
router.get("/my-bookings", protect, getMyBookings);

// --- NEW ROUTES ---
router.get("/my-assigned-flights", protect, getMyAssignedFlights);

// Route for admin to delete a user
router.delete("/:id", protect, adminOnly, deleteUser); // <-- ADDED

router.put("/:id", protect, updateUserProfile); // User updates self, admin updates anyone
router.delete("/:id", protect, adminOnly, deleteUser); // Only Admin deletes

// Route for user to get/update their own profile
// We use the same controller for get and update
router.put("/:id", protect, updateUserProfile); // <-- ADDED

export default router;
