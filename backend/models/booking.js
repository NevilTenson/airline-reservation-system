// models/Booking.js

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Import models to create associations
import User from "./User.js";
import Ticket from "./Ticket.js";
import Payment from "./Payment.js";
import Passenger from "./Passenger.js";

const Booking = sequelize.define(
  "Booking",
  {
    booking_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    pnr_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "PNR for the entire booking",
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "The total cost for all tickets in this booking",
    },
    status: {
      type: DataTypes.ENUM("Pending", "Confirmed", "Cancelled"),
      defaultValue: "Pending",
    },
    booking_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
  }
);



export default Booking;