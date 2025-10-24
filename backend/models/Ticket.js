// models/Ticket.js

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Flight from "./Flight.js";
import Class from "./Class.js";
import Passenger from "./Passenger.js"; // <-- Import new model

const Ticket = sequelize.define(
  "Ticket",
  {
    ticket_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // REMOVED: passenger_name (moved to Passenger)
    // REMOVED: booking_id (will be linked via Passenger)
    
    seat_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    travel_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Booked", "Cancelled", "Completed"),
      defaultValue: "Booked",
    },
  },
  {
    tableName: "tickets",
    timestamps: true,
  }
);



export default Ticket;