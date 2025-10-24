import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Airline = sequelize.define("Airline", {
  name: { type: DataTypes.STRING, allowNull: false },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  country: { type: DataTypes.STRING, allowNull: false },
});

export default Airline;
