import express from 'express';
import { Op } from 'sequelize';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

// Import all necessary models
import {
  User,
  Ticket,
  Flight,
  Airline,
  Airport,
  Class,
  Passenger,
  Booking
} from '../models/index.js';

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    Get an activity report for a specific user ID
 * @access  Private (Admin)
 * @query   userId (integer) - The ID of the user to search for
 */
router.get('/', protect, adminOnly, async (req, res) => {
  // --- FIX HERE: Expect userId ---
  const { userId } = req.query; // Changed from 'name'
  if (!userId) { // Check for userId
    // --- FIX HERE: Updated error message ---
    return res.status(400).json({ message: 'User ID query parameter is required.' }); // Updated message
  }
  // --- END FIX ---

  console.log(`🔍 Generating report for user ID: ${userId}`);

  try {
    // Find user by Primary Key (ID) - This part is already correct
    const user = await User.findByPk(userId);

    if (!user) {
      console.log(`❓ User not found with ID '${userId}'`);
      return res.status(404).json({ message: `User not found with ID '${userId}'` });
    }

    console.log(`👤 User found: ${user.name} (ID: ${user.id})`);

    // --- FIND USER'S TICKETS (Query remains the same) ---
    console.log(`🎫 Fetching tickets for user ID: ${user.id}`);
    const tickets = await Ticket.findAll({
      include: [
        {
          model: Passenger,
          required: true,
          include: [
            {
              model: Booking,
              required: true,
              where: { user_id: user.id } // Correct column name
            }
          ]
        },
        {
          model: Flight,
          include: [
            { model: Airline },
            { model: Airport, as: 'Origin' },
            { model: Airport, as: 'Destination' }
          ]
        },
        { model: Class }
      ]
    });
    console.log(`✅ Found ${tickets.length} tickets for user ${user.name}`);
    // --- END TICKET QUERY ---


    // Report 2: Pilot's Assigned Flights (Optional)
    let assignedFlights = [];
    if (user.role === 'pilot') {
      console.log(`👨‍✈️ Fetching assigned flights for pilot ID: ${user.id}`);
      // assignedFlights = await Flight.findAll({ where: { pilotId: user.id }, ... });
       console.log(`✅ Found ${assignedFlights.length} assigned flights`);
    }

    // Send the complete report as JSON
    const reportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      totalBookings: tickets.length,
      bookings: tickets, // List of tickets associated with the user
      assignedFlights: assignedFlights
    };

    console.log("✅ Report generated successfully.");
    res.json(reportData);

  } catch (err) {
    console.error('💥 Report generation error:', err);
    res.status(500).json({ message: 'Server error generating report.' });
  }
});

export default router;