import express from "express";
import { createPayment, getPayments, getPaymentByTicket } from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createPayment);
router.get("/", protect, getPayments);
router.get("/:ticket_id", protect, getPaymentByTicket);

export default router;
