import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { sequelize } from "./models/index.js";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import airlineRoutes from "./routes/airlineRoutes.js";
import flightRoutes from "./routes/flightRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import airportRoutes from "./routes/airportRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// --- MOVED STATIC FILES HERE ---
// Serve static frontend files FIRST
// This will automatically serve Frontend/index.html for the '/' route
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../Frontend")));
// --- END MOVE ---

// Optional: Keep a specific '/' route for API info,
// but it won't be hit by browsers visiting the root anymore.
// Or you can remove it entirely.
app.get("/api-info", (req, res) => res.send("Airline Reservation System API is running"));

// API Routes (defined AFTER static files)
app.use("/api/users", userRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/airports", airportRoutes);

// --- CATCH-ALL FOR FRONTEND ROUTING (Optional but Recommended for SPAs) ---
// If you were using a frontend framework with routing (like React Router),
// you would add a catch-all route here to send index.html for any unknown GET request.
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../Frontend', 'index.html'));
// });
// --- END CATCH-ALL ---


// Global error handlers (log and keep useful info)
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  // Optional: process.exit(1);
});

// Start sequence: test DB and sync before listening
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully");

    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized with MySQL database");

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    // process.exit(1);
  }
};

startServer();