import express from "express";
import { addClass, getClasses } from "../controllers/ClassController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only admin can add class
router.post("/", protect, adminOnly, addClass);

// Everyone can view classes
router.get("/", getClasses);

export default router;
