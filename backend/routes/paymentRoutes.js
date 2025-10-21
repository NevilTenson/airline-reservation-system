import express from 'express';
import { makePayment, getTicketPayments } from '../controllers/PaymentController.js';

const router = express.Router();

// Make payment for a ticket
router.post('/pay', makePayment);

// Get payments for a ticket
router.get('/ticket/:ticketId', getTicketPayments);

export default router;
