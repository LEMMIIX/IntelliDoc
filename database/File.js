/**
 * Diese Datei enthält die Definition des File-Modells
 * @autor Miray
 * 
 */


const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize.config.js");

const File = sequelize.define(
  "File",
  {
    file_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    embedding: {
      type: 'VECTOR(768)', 
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_data: {
      type: DataTypes.BLOB,
      allowNull: false,
    },
    folder_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    cluster_label: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    original_file_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "files",
    schema: "main",
    timestamps: false,
  }
);

module.exports = File;
