import Payment from "../models/Payment.js"; // <-- CORRECTED PATH
import Ticket from "../models/Ticket.js"; // <-- CORRECTED PATH

// Create new payment
export const createPayment = async (req, res) => {
  try {
    const { ticket_id, payment_mode, amount } = req.body;

    const ticket = await Ticket.findByPk(ticket_id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const existing = await Payment.findOne({ where: { ticket_id } });
    if (existing) return res.status(400).json({ message: "Payment already exists for this ticket" });

    // 🔹 Auto-generate unique transaction ID
    const transaction_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const payment = await Payment.create({
      ticket_id,
      transaction_id,
      payment_mode,
      amount,
      status: "Success",
    });

    res.status(201).json({ message: "Payment successful", payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all payments
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({ include: Ticket });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
};

// Get payment by ticket_id
export const getPaymentByTicket = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const payment = await Payment.findOne({ where: { ticket_id }, include: Ticket });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment", error: error.message });
  }
};

