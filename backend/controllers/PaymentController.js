import Payment from '../models/Payment.js';
import Ticket from '../models/Ticket.js';

// Make a payment for a ticket
export const makePayment = async (req, res) => {
  try {
    const { ticketId, paymentMode, amount } = req.body;

    // Check if ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Create payment
    const payment = new Payment({
  ticketId,
  transactionId: `TXN${Date.now()}`, // auto-generate
  paymentMode,
  amount
});


    await payment.save();
    res.status(201).json({ message: 'Payment successful', payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payments for a ticket
export const getTicketPayments = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const payments = await Payment.find({ ticketId });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
