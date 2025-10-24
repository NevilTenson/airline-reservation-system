import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Flight from "./Flight.js";

const ClassModel = sequelize.define("Class", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  classType: { type: DataTypes.STRING, allowNull: false },
  
  // ADDED: total_seats
  total_seats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Total seat capacity for this specific class",
  },
  
  fare: { type: DataTypes.FLOAT, allowNull: false },
});

// 🔗 Associations
ClassModel.belongsTo(Flight, { foreignKey: "flight_id" });
Flight.hasMany(ClassModel, { foreignKey: "flight_id" });

export default ClassModel;