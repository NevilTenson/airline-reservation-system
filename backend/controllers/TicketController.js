import { sequelize } from "../models/index.js";
import Booking from "../models/booking.js"; // <-- CORRECTED
import Ticket from "../models/Ticket.js"; // <-- CORRECTED
import Flight from "../models/Flight.js"; // <-- CORRECTED
import Class from "../models/Class.js"; // <-- CORRECTED
import User from "../models/User.js"; // <-- CORRECTED
import Payment from "../models/Payment.js"; // <-- CORRECTED
import Passenger from "../models/Passenger.js"; // <-- CORRECTED
import Airport from "../models/Airport.js"; // <-- CORRECTED
// ----------------------------------------------------------------
// 🎟 CREATE A NEW BOOKING (UPDATED)
// ----------------------------------------------------------------
export const createBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user_id = req.user.id;
    // The 'passengers' array must now contain full objects
    const { flight_id, class_id, passengers, payment_details } = req.body;

    // --- Validation (UPDATED) ---
    if (!flight_id || !class_id || !passengers || !payment_details) {
      throw new Error("flight_id, class_id, passengers, and payment_details are required");
    }
    if (!Array.isArray(passengers) || passengers.length === 0) {
      throw new Error("Passengers must be a non-empty array");
    }

    const flight = await Flight.findByPk(flight_id, { transaction: t });
    if (!flight) throw new Error("Flight not found");

    const classInfo = await Class.findOne({
      where: { id: class_id, flight_id: flight_id },
      transaction: t,
    });
    if (!classInfo) throw new Error("Class not found for this flight");

    // Seat Availability Check
    const soldTickets = await Ticket.count({
      where: { class_id: class_id, status: "Booked" }, // Be more specific
      transaction: t,
    });
    const availableSeats = classInfo.total_seats - soldTickets;
    if (availableSeats < passengers.length) {
      throw new Error(`Not enough seats available. Required: ${passengers.length}, Available: ${availableSeats}`);
    }

    // Passenger and Seat Validation (UPDATED)
    for (const p of passengers) {
      if (!p.name || !p.age || !p.gender || !p.seat_no) {
        throw new Error("Each passenger must have a name, age, gender, and seat_no");
      }
      const seatTaken = await Ticket.findOne({
        where: { flight_id, seat_no: p.seat_no, status: "Booked" },
        transaction: t,
      });
      if (seatTaken) throw new Error(`Seat ${p.seat_no} is already booked`);
    }

    // --- End Validation ---

    const total_amount = passengers.length * classInfo.fare;
    const pnr_no = `PNR${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 1. Create the Booking
    const newBooking = await Booking.create(
      {
        user_id: user_id,
        pnr_no: pnr_no,
        total_amount: total_amount,
        status: "Confirmed",
      },
      { transaction: t }
    );

    // 2. Create the Payment
    await Payment.create(
      {
        booking_id: newBooking.booking_id,
        transaction_id: payment_details.transaction_id,
        payment_mode: payment_details.payment_mode,
        amount: total_amount,
        status: "Success",
      },
      { transaction: t }
    );

    // 3. Create a Passenger record for each passenger (NEW)
    const passengerPromises = passengers.map((p) => {
      return Passenger.create(
        {
          booking_id: newBooking.booking_id,
          name: p.name,
          age: p.age,
          gender: p.gender,
        },
        { transaction: t }
      );
    });
    const newPassengers = await Promise.all(passengerPromises);

    // 4. Create a Ticket for each new Passenger (UPDATED)
    const ticketPromises = newPassengers.map((newPassenger, index) => {
      return Ticket.create(
        {
          passenger_id: newPassenger.passenger_id, // <-- LINK TO PASSENGER
          flight_id: flight_id,
          class_id: class_id,
          seat_no: passengers[index].seat_no, // Get seat_no from original array
          travel_date: flight.departureTime,
          status: "Booked",
        },
        { transaction: t }
      );
    });
    await Promise.all(ticketPromises);

    // 5. Commit
    await t.commit();
    res.status(201).json({ message: "Booking successful", booking: newBooking });

  } catch (error) {
    await t.rollback();
    console.error("❌ Error creating booking:", error);
    res.status(400).json({ message: "Booking failed", error: error.message });
  }
};

// ----------------------------------------------------------------
// 👨‍👩‍👧 GET MY BOOKINGS (UPDATED)
// ----------------------------------------------------------------
export const getMyBookings = async (req, res) => {
  try {
    const user_id = req.user.id; // From 'protect' middleware
    const bookings = await Booking.findAll({
      where: { user_id: user_id },
      include: [
        { model: Payment },
        {
          model: Passenger,
          include: [
            {
              model: Ticket,
              include: [
                {
                  model: Flight,
                  // --- THIS IS THE PART WE ARE FIXING ---
                  // Remove the old attributes line
                  // attributes: ["flightNumber", "origin", "destination"], // <-- REMOVE THIS
                  // Add includes for the associated Airport models
                  include: [
                      { model: Airport, as: 'Origin', attributes: ['city', 'airport_code'] },
                      { model: Airport, as: 'Destination', attributes: ['city', 'airport_code'] }
                  ]
                  // --- END FIX ---
                },
                { model: Class, attributes: ["classType", "fare"] },
              ],
            },
          ],
        },
      ],
      order: [["booking_date", "DESC"]], // Show newest first
    });
    res.json(bookings);
  } catch (error) {
    console.error("❌ Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message }); // Send error message
  }
};


// ----------------------------------------------------------------
// 🔍 GET BOOKING BY PNR (UPDATED)
// ----------------------------------------------------------------
export const getBookingByPNR = async (req, res) => {
  try {
    const { pnr } = req.params;
    const booking = await Booking.findOne({
      where: { pnr_no: pnr },
      include: [
        { model: User, attributes: ["name", "email"] },
        { model: Payment },
        {
          model: Passenger, // <-- Include Passengers
          include: [
            {
              model: Ticket, // <-- Include Ticket *within* Passenger
              include: [
                { model: Flight, attributes: ["flightNumber", "origin_code", "destination_code"], include: [ // Corrected attributes
                    { model: Airport, as: 'Origin', attributes: ['city', 'airport_code'] },
                    { model: Airport, as: 'Destination', attributes: ['city', 'airport_code'] }
                ] }, 
                { model: Class, attributes: ["classType", "fare"] },
              ],
            },
          ],
        },
      ],
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (req.user.role !== 'admin' && req.user.id !== booking.user_id) {
       return res.status(403).json({ message: "Not authorized to view this booking" });
    }

    res.json(booking);
  } catch (error) {
    console.error("❌ Error fetching booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------------
// ❌ CANCEL BOOKING (UPDATED)
// ----------------------------------------------------------------
export const cancelBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { pnr } = req.params;
    const booking = await Booking.findOne({ 
      where: { pnr_no: pnr },
      include: [Passenger] // <-- Need passengers to get ticket IDs
    }); 
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (req.user.role !== 'admin' && req.user.id !== booking.user_id) {
       return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    await booking.update({ status: "Cancelled" }, { transaction: t });
    
    // Get all passenger IDs for this booking
    const passengerIds = booking.Passengers.map(p => p.passenger_id);
    
    // Update all tickets associated with these passengers
    await Ticket.update(
      { status: "Cancelled" },
      { where: { passenger_id: passengerIds } }, // <-- Update tickets via passenger_id
      { transaction: t }
    );
    
    await Payment.update(
        { status: "Failed" }, // Or 'Refunded'
        { where: { booking_id: booking.booking_id } },
        { transaction: t }
    );

    await t.commit();
    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error cancelling booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------------
// 👑 ADMIN: GET ALL TICKETS (UPDATED)
// ----------------------------------------------------------------
export const ADMIN_getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      include: [
        {
          model: Passenger,
          include: [
            {
              model: Booking,
              include: [{ model: User, attributes: ["name", "email"] }],
            },
          ],
        },
        {
          model: Flight,
          // --- THIS IS THE PART WE ARE FIXING ---
          // Remove the old attributes line
          // attributes: ["flightNumber", "origin", "destination"], // <-- REMOVE THIS
          // Add includes for the associated Airport models
          include: [
              { model: Airport, as: 'Origin', attributes: ['city', 'airport_code'] },
              { model: Airport, as: 'Destination', attributes: ['city', 'airport_code'] }
          ]
          // --- END FIX ---
        },
        { model: Class, attributes: ["classType", "fare"] },
      ],
      order: [["travel_date", "DESC"]],
    });
    res.json(tickets);
  } catch (error) {
    console.error("❌ Error fetching all tickets:", error);
    res.status(500).json({ message: "Server error", error: error.message }); // Send error message back
  }
};

// --- NEW FUNCTION: ADMIN DELETE TICKET ---
export const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        // Note: This will cascade and delete from associated tables
        // based on your model definitions (e.g., Passenger)
        await ticket.destroy();
        res.json({ message: "Ticket removed successfully" });
    } catch (err) {
        console.error("❌ Error deleting ticket:", err);
        res.status(500).json({ error: err.message });
    }
};

