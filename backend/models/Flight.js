// models/Flight.js

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Airline from "./Airline.js";
import Airport from "./Airport.js"; // <-- Import the new model

const Flight = sequelize.define("Flight", {
  flightNumber: { type: DataTypes.STRING, allowNull: false, unique: true },

  // REMOVED: origin (String)
  // REMOVED: destination (String)

  departureTime: { type: DataTypes.DATE, allowNull: false },
  arrivalTime: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  
  // ADDED: Foreign Keys
  // We don't need to explicitly add them here; 
  // Sequelize adds them via the associations below.
});


export default Flight;