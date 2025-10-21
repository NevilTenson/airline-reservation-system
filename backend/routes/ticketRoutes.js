import express from 'express';
import { bookTicket, getUserTickets, cancelTicket } from '../controllers/TicketController.js';

const router = express.Router();

// Book ticket
router.post('/book', bookTicket);

// Get tickets for a user
router.get('/user/:userId', getUserTickets);

// Cancel ticket
router.delete('/cancel/:ticketId', cancelTicket);

export default router;
