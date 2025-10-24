import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Booking from "./booking.js"; // Note: Filename might be booking.js

const Passenger = sequelize.define(
  "Passenger",
  {
    passenger_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: false,
    },
  },
  {
    tableName: "passengers",
    timestamps: false, // Passenger details are part of the booking, no need to track updates
  }
);


export default Passenger;