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
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CORRECTED PATHS ---
// Specific route for the homepage
app.get("/", (req, res) => {
  // Use 'Frontend' (capital F, no dot)
  res.sendFile(path.join(__dirname, "../Frontend/home.html"));
});

// Serve static files from the 'Frontend' directory
// Use 'Frontend' (capital F, no dot)
app.use(express.static(path.join(__dirname, "../Frontend")));
// --- END CORRECTED PATHS ---


app.get("/api-info", (req, res) => res.send("Airline Reservation System API is running"));

// API Routes (defined AFTER static files)
app.use("/api/users", userRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/airports", airportRoutes);
app.use("/api/reports", reportRoutes);

// Global error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

// Start sequence
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
  }
};

startServer();