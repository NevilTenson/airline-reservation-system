import express from "express";
import { addClass, getClasses, deleteClass } from "../controllers/ClassController.js"; // <-- ADDED deleteClass
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admin can add class
router.post("/", protect, adminOnly, addClass);

// Everyone can view classes
router.get("/", getClasses);

// Admin deletes a class
router.delete("/:id", protect, adminOnly, deleteClass);

export default router;
