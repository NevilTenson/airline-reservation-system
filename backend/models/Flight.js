import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Ensure this path is correct
// No need to import User here, association is done in index.js

const Flight = sequelize.define("Flight", {
  id: { // Define id explicitly as primary key
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  flightNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  departureTime: { type: DataTypes.DATE, allowNull: false },
  arrivalTime: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },

  // --- ADDED pilotId FIELD ---
  // This field will store the ID of the User (who must have role='pilot') assigned to this flight.
  pilotId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Flights might not have a pilot assigned initially
      references: {
          model: 'Users', // Refers to the 'Users' table
          key: 'id'
      },
      onUpdate: 'CASCADE', // Optional: if user ID changes, update here
      onDelete: 'SET NULL' // Optional: if pilot user is deleted, set pilotId to null
  }
  // --- END ADDED FIELD ---

  // Foreign keys for airline_id, origin_code, destination_code
  // are added automatically by associations in models/index.js
});


export default Flight;
