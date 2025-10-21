import Ticket from '../models/Ticket.js';
import Flight from '../models/Flight.js';
import ClassModel from '../models/Class.js';
import User from '../models/User.js';

// Book a ticket
export const bookTicket = async (req, res) => {
  try {
    const { userId, flightId, classId, passengerName, seatNumber, source, destination } = req.body;

    // Check if flight exists
    const flight = await Flight.findById(flightId);
    if (!flight) return res.status(404).json({ message: 'Flight not found' });

    // Check seat availability
    if (flight.seatAvailability <= 0) return res.status(400).json({ message: 'No seats available' });

    // Reduce seat availability
    flight.seatAvailability -= 1;
    await flight.save();

    // Create ticket
    const ticket = new Ticket({
      PNR: `PNR${Date.now()}`, // Simple PNR generation
      userId,
      flightId,
      classId,
      passengerName,
      seatNumber,
      source,
      destination
    });

    await ticket.save();
    res.status(201).json({ message: 'Ticket booked successfully', ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tickets for a user
export const getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;
    const tickets = await Ticket.find({ userId })
      .populate('flightId', 'flightNumber flightName source destination departureTime arrivalTime')
      .populate('classId', 'classType fare');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancel ticket
export const cancelTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Find ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Find flight associated with ticket
    const flight = await Flight.findById(ticket.flightId);
    if (!flight) return res.status(404).json({ message: 'Flight not found for this ticket' });

    // Restore seat availability
    flight.seatAvailability += 1;
    await flight.save();

    // Delete ticket
    await ticket.deleteOne();

    res.json({ message: 'Ticket cancelled successfully, seat restored' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

