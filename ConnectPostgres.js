require('dotenv').config({ path: './dbLogin/.env' });

const { Client } = require('pg')

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

client.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
