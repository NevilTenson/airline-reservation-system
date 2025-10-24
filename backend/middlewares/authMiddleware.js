import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify token for any logged-in user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (Sequelize version)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (error) {
      console.error("JWT verification error:", error.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// Admin-only middleware
export const adminOnly = (req, res, next) => {
  console.log("🔹 User in adminOnly:", req.user);
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    console.log("❌ Access denied: not admin");
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

