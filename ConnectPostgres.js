/**
 * @module ConnectPostgres
 * @description Database connection configuration and query management module for PostgreSQL
 * @requires pg
 * @requires child_process
 */

const { Pool } = require('pg');
const { execSync } = require('child_process');

/**
 * @constant {Object}
 * @description Database configuration settings
 * @private
 */
const dbConfig = {
    database: "postgres",
    user: "postgres",
    password: "pgres",
    host: "postgres", // for docker setup
    //host: "localhost", // for local development
    port: 5432
};

/**
 * Retrieves the current Git branch name
 * @private
 * @function getGitBranch
 * @returns {?string} The current branch name or null if retrieval fails
 */
function getGitBranch() {
    try {
        const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        return branchName;
    } catch (error) {
        console.error("Error fetching Git branch:", error);
        return null;
    }
}

/**
 * Creates a new connection pool for a single query
 * @private
 * @function createPool
 * @returns {Pool} A new PostgreSQL connection pool
 */
function createPool() {
    return new Pool(dbConfig);
}

/**
 * Explicit method to check database connection
 * @async
 * @function checkConnection
 * @returns {Promise<void>}
 */
async function checkConnection() {
    const pool = createPool();
    try {
        const client = await pool.connect();
        const branch = getGitBranch();
        console.log('Connected to the PostgreSQL database.');
        console.log(`Git on branch: ${branch}`);
        client.release();
    } catch (err) {
        console.error('Error connecting to the database:', err);
        throw err;
    } finally {
        await pool.end();
    }
}

/**
 * @typedef {Object} QueryResult
 * @property {Array} rows The rows returned by the query
 * @property {number} rowCount Number of rows affected by the query
 */

/**
 * Database interface providing configuration and query execution capabilities
 * @exports ConnectPostgres
 * @type {Object}
 */
module.exports = {
    /**
     * Database configuration for use in other modules
     * @type {Object}
     */
    dbConfig,

    /**
     * Executes a parameterized SQL query
     * @async
     * @function query
     * @param {string} text The SQL query text
     * @param {Array} [params] Query parameters
     * @returns {Promise<QueryResult>} The query result
     * @throws {Error} If query execution fails
     */
    query: async (text, params) => {
        const pool = createPool();
        try {
            const result = await pool.query(text, params);
            return result;
        } catch (err) {
            console.error('Error executing query:', err);
            throw err;
        } finally {
            await pool.end();
        }
    },

    /**
     * Check database connection status
     * @function checkConnection
     */
    checkConnection
};

/**
 * @example
 * 
 * Basic query execution:
 * ```javascript
 * try {
 *   const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 *   console.log(result.rows);
 * } catch (error) {
 *   console.error('Query failed:', error);
 * }
 * ```
 * 
 * Using database configuration in other modules:
 * ```javascript
 * const { dbConfig } = require('./ConnectPostgres');
 * const { Sequelize } = require('sequelize');
 * 
 * const sequelize = new Sequelize(
 *   dbConfig.database,
 *   dbConfig.user,
 *   dbConfig.password,
 *   {
 *     host: dbConfig.host,
 *     dialect: 'postgres'
 *   }
 * );
 * ```
 * 
 * Checking database connection:
 * ```javascript
 * try {
 *   await db.checkConnection();
 *   console.log('Database connection successful');
 * } catch (error) {
 *   console.error('Unable to connect to the database:', error);
 * }
 * ```
 */