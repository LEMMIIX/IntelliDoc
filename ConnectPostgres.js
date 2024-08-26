require('dotenv').config({ path: './dbLogin/.env' });

const { Client } = require('pg')

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});


const connectDB = () => {
    client.connect()
    .then(() => console.log('Connected to Postgres'))
    .catch(err => console.error('connection error', err.stack))
}

module.exports = connectDB;



