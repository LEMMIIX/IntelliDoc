
/**
 * Diese Datei enthält die Definition des Folder-Modells.
 * @autor Luca
 * 
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize.config.js");

const Folder = sequelize.define(
  "Folder",
  {
    folder_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parent_folder_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    folder_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    embedding: {
      type: 'VECTOR(768)', // Annahme: Embeddings sind 768-dimensional
      allowNull: true,
    },
  },
  {
    tableName: "folders",
    schema: "main",
    timestamps: false, // Da wir `created_at` manuell definiert haben
  }
);

module.exports = Folder;
