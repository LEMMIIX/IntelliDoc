const { Sequelize } = require("sequelize");
const { dbConfig } = require("./ConnectPostgres");

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.user,
    dbConfig.password, 
    {
        host: dbConfig.host,
        dialect: "postgres",
        logging: false,
        schema: 'main',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;