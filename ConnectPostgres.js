require('dotenv').config({ path: './dbLogin/.env' });

const { Client } = require('pg')

const client = new Client({
  user: "student",
  host: "192.168.198.119",
  database: "intellidocdb",
  password: "student",

  port: "5432"
});
//Versuch sich mit der Datenbank zu verbinden
const connectDB = () => {
    client.connect()
    .then(() => console.log(
      'Connected to ' + client.database
      + '\n\ton host ID:\t' + client.host
      + '\n\tas user:\t' + client.user
      + '\n\ton port:\t' + client.port))
    .catch(err => console.error('connection error', err.stack))
}

module.exports = connectDB;



