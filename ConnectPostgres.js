const { Pool } = require('pg');
const { execSync } = require('child_process');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
});

// Git debug, derzeitigen branch anzeigen lassen
function getGitBranch() {
  try {
      // Execute Git command to get the branch name
      const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      return branchName;
  } catch (error) {
      console.error("Error fetching Git branch:", error);
      return null;
  }
}

// Establish a connection immediately
pool.connect((err, client, release) => {
  if (err) {
      console.error('Error connecting to the database:', err);
  } else {
      const branch = getGitBranch();
      console.log('Connected to the PostgreSQL database.');
      console.log(`Git on branch: ${branch}`);
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