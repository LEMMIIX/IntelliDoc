const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'pgres',
    port: 5432,
});

// Establish a connection immediately
pool.connect((err, client, release) => {
  if (err) {
      console.error('Error connecting to the database:', err);
  } else {
      console.log('Connected to the PostgreSQL database, branch postgres_fix');
      release(); // Release the client back to the pool
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => {
      console.log('Executing database query:', { text, params: params.map((p, i) => i === 2 ? '[REDACTED]' : p) });
      return pool.query(text, params)
          .then(res => {
              console.log('Query executed successfully. Rows affected:', res.rowCount);
              return res;
          })
          .catch(err => {
              console.error('Error executing query:', err);
              throw err;
          });
  },
};