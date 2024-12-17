/**
 * Diese Datei enth�lt die Definition des UserRole-Modells.
 * Sie erm�glicht die Verwaltung von Benutzerrollen in der Datenbank.
 *
 * @autor Luca
 *
 */


const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize.config");

const UserRole = sequelize.define(
  "UserRole",
  {
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "user_roles",
    schema: "main",
    timestamps: false, 
  }
);

module.exports = UserRole;
