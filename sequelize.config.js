// author: Miray Kilic
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("IntelliDoc", "postgres", "postgres", {
  host: "localhost",
  dialect: "postgres", 
  logging: false, 
});

module.exports = sequelize;
