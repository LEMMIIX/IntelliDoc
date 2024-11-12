const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize.config");

const UserRoleMapping = sequelize.define(
  "UserRoleMapping",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "users", 
        key: "user_id",
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "user_roles", 
        key: "role_id",
      },
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "user_roles_mapping",
    schema: "main",
    timestamps: false, 
  }
);

module.exports = UserRoleMapping;
