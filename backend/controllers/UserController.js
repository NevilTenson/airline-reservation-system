import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize"; // <-- Import Op
import User from "../models/User.js"; // <-- Correct model path

// Register a new user (or admin) - UPDATED VERSION
export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    // --- INPUT VALIDATION ---
    if (!name || !username || !email || !password) {
        return res.status(400).json({ message: "Name, username, email, and password are required." });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }
    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(email)) {
       return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    // --- END VALIDATION ---


    // --- CHECK FOR EXISTING USER (Email OR Username) ---
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [ // Sequelize Operator for OR condition
                { email: email },
                { username: username }
            ]
        }
    });

    if (existingUser) {
        // Check which field caused the conflict
        if (existingUser.email === email) {
            return res.status(400).json({ message: "User already exists with this email." });
        } else {
            return res.status(400).json({ message: "Username is already taken." });
        }
    }
    // --- END CHECK ---


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role: role || "user", // Default to 'user' if role not provided
    });

    // Don't send password back, even hashed
    const userResponse = {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });

  } catch (error) {
    // Log the detailed error on the server
    console.error("❌ Error registering user:", error);
    // Send a generic error message to the client ONLY if it's not a validation error we already handled
    if (!res.headersSent) { // Check if response hasn't already been sent
        res.status(500).json({ message: "Server error during registration." });
    }
  }
};

// Login user or admin
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name }, // Added name to token
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch all users (admin only, supports role filtering)
export const getAllUsers = async (req, res) => {
  try {
    // --- THIS IS THE UPDATED LOGIC ---
    const { role } = req.query; // Check for a role in the query string
    let whereClause = {}; // Start with an empty filter

    if (role === 'user' || role === 'pilot' || role === 'admin') {
      whereClause.role = role; // If a valid role is provided, add it to the filter
    }
    // --- END OF UPDATED LOGIC ---

    const users = await User.findAll({
      where: whereClause, // Apply the filter
      attributes: ["id", "name", "email", "role", "createdAt"], // Exclude password
      order: [["name", "ASC"]] // Order by name
    });
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete User (Admin only)
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Add check to prevent admin from deleting self?
        if (req.user && user.id === req.user.id) { // Check if req.user exists
            return res.status(400).json({ message: "Admin cannot delete self." });
        }

        await user.destroy();
        res.json({ message: "User removed successfully" });
    } catch (err) {
        console.error("❌ Error deleting user:", err);
        res.status(500).json({ error: err.message });
    }
};

// Update User Profile (User/Admin)
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        // Check if user is admin OR if they are updating their own profile
        // Ensure req.user and req.user.id exist before comparing
        if (!req.user || (req.user.role !== 'admin' && req.user.id !== parseInt(userId))) {
            return res.status(403).json({ message: "Not authorized." });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const { name, email, password } = req.body;

        // --- VALIDATION ---
        if (name !== undefined && name.trim() === '') {
            return res.status(400).json({ message: "Name cannot be empty." });
        }
        if (email !== undefined) {
            if (email.trim() === '') return res.status(400).json({ message: "Email cannot be empty." });
            if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
        }
        // --- END VALIDATION ---

        // Update basic info if provided
        user.name = name?.trim() || user.name;
        user.email = email?.trim() || user.email;

        // Update password if provided
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters."});
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        // Return updated user data (excluding password)
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: "Profile updated successfully." // Added success message in response
        });

    } catch (err) {
        console.error("❌ Error updating profile:", err);
        // Handle potential unique constraint error (e.g., email already exists)
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email already in use by another account.' });
        }
        res.status(500).json({ message: "Server error updating profile.", error: err.message }); // Send error message
    }
};

// Add this function inside UserController.js
export const getMyAssignedFlights = async (req, res) => {
    // This route is protected, so req.user should exist
    if (!req.user || req.user.role !== 'pilot') {
        return res.status(403).json({ message: "Access denied: Pilots only." });
    }
    const pilotId = req.user.id;

    try {
        const assignedFlights = await Flight.findAll({
            where: { pilotId: pilotId },
            include: [ // Include details needed for the dashboard
                { model: Airline, attributes: ['name', 'code'] },
                { model: Airport, as: 'Origin', attributes: ['city', 'airport_code'] },
                { model: Airport, as: 'Destination', attributes: ['city', 'airport_code'] }
            ],
            order: [['departureTime', 'ASC']] // Show upcoming flights first
        });

        res.json(assignedFlights);

    } catch (error) {
        console.error(`❌ Error fetching flights for pilot ${pilotId}:`, error);
        res.status(500).json({ message: "Server error fetching assigned flights." });
    }
};

