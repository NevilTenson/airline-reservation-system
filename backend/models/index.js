// backend/models/index.js
import sequelize from "../config/db.js";

// --- Import ALL models ---
import Airline from "./Airline.js";
import Airport from "./Airport.js"; // New
import Flight from "./Flight.js";
import Class from "./Class.js"; // Renamed from ClassModel if you used that
import User from "./User.js";
import Booking from "./booking.js"; // New
import Passenger from "./Passenger.js"; // New
import Ticket from "./Ticket.js";
import Payment from "./Payment.js";

/* =======================
   DEFINE RELATIONSHIPS
   (Centralized & Corrected)
   ======================= */

// --- Relationships involving AIRLINE ---
// ✈️ Airline <-> Flight (1:M)
Airline.hasMany(Flight, { foreignKey: "airline_id", onDelete: "CASCADE" });
Flight.belongsTo(Airline, { foreignKey: "airline_id" });

// --- Relationships involving AIRPORT ---
// 🛫 Flight <-> Airport (Origin) (M:1)
Flight.belongsTo(Airport, { as: "Origin", foreignKey: "origin_code" });
// Airport.hasMany(Flight, { foreignKey: 'origin_code' }); // Optional inverse

// 🛬 Flight <-> Airport (Destination) (M:1)
Flight.belongsTo(Airport, { as: "Destination", foreignKey: "destination_code" });
// Airport.hasMany(Flight, { foreignKey: 'destination_code' }); // Optional inverse

// --- Relationships involving FLIGHT ---
// 🛩 Flight <-> Class (1:M)
Flight.hasMany(Class, { foreignKey: "flight_id", onDelete: "CASCADE" });
Class.belongsTo(Flight, { foreignKey: "flight_id" });

// 🎟 Flight <-> Ticket (1:M) - A flight can have many tickets sold for it
Flight.hasMany(Ticket, { foreignKey: "flight_id", onDelete: "NO ACTION" }); // Avoid cascading delete from flight
Ticket.belongsTo(Flight, { foreignKey: "flight_id" });

// --- Relationships involving CLASS ---
// 💺 Class <-> Ticket (1:M) - A specific class offering has many tickets
Class.hasMany(Ticket, { foreignKey: "class_id", onDelete: "NO ACTION" }); // Avoid cascading delete from class
Ticket.belongsTo(Class, { foreignKey: "class_id" });

// --- Relationships involving USER ---
// 👤 User <-> Booking (1:M)
User.hasMany(Booking, { foreignKey: "user_id", onDelete: "CASCADE" }); // If user deleted, delete their bookings
Booking.belongsTo(User, { foreignKey: "user_id" });

// --- Relationships involving BOOKING ---
// 📒 Booking <-> Passenger (1:M)
Booking.hasMany(Passenger, { foreignKey: "booking_id", onDelete: "CASCADE" }); // If booking deleted, delete passengers
Passenger.belongsTo(Booking, { foreignKey: "booking_id" });

// 💳 Booking <-> Payment (1:1)
Booking.hasOne(Payment, { foreignKey: "booking_id", onDelete: "CASCADE" }); // If booking deleted, delete payment
Payment.belongsTo(Booking, { foreignKey: "booking_id" });

// --- Relationships involving PASSENGER ---
// 🧍 Passenger <-> Ticket (1:1)
Passenger.hasOne(Ticket, { foreignKey: "passenger_id", onDelete: "CASCADE" }); // If passenger deleted, delete ticket
Ticket.belongsTo(Passenger, { foreignKey: "passenger_id" });


/* =======================
   EXPORT MODELS & DB
   ======================= */
export {
  sequelize,
  Airline,
  Airport, // Added
  Flight,
  Class,
  User,
  Booking, // Added
  Passenger, // Added
  Ticket,
  Payment,
};