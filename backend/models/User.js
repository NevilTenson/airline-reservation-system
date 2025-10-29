import { DataTypes } from "sequelize";
import sequelize from "../config/db.js"; // Ensure this path is correct

const User = sequelize.define("User", {
  id: { // Define id explicitly as primary key
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  // --- UPDATED ROLE DEFINITION ---
  role: {
    type: DataTypes.ENUM('user', 'admin', 'pilot'), // Changed to ENUM
    allowNull: false,
    defaultValue: "user"
  },
  // --- END UPDATE ---
});

export default User;
