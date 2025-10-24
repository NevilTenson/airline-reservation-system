// models/Payment.js

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Payment = sequelize.define("Payment", {
  payment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // CHANGED: This is now linked to a Booking, not a Ticket
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transaction_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  payment_mode: {
    type: DataTypes.ENUM("Credit Card", "Debit Card", "UPI", "Net Banking", "Cash"),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("Success", "Pending", "Failed"),
    defaultValue: "Pending",
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// The Payment <-> Booking relationship is defined in Booking.js
export default Payment;