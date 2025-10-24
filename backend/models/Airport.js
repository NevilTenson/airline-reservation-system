// models/Airport.js

import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Airport = sequelize.define(
  "Airport",
  {
    airport_code: {
      type: DataTypes.STRING(3), // e.g., "DEL"
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "e.g., Indira Gandhi International Airport",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "airports",
    timestamps: false, // Airports are static data, timestamps aren't critical
  }
);

export default Airport;