const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');
const User = require('./modelUser');
/**
const registerUser = async (username, email, password) => {
    const user = new User(username, email, password);
    user.validate();

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO public.users (username, email, password) VALUES ($1, $2, $3) RETURNING id';
        const values = [username, email, hashedPassword];

        const result = await db.query(query, values);
        console.log('User inserted into database with ID:', result.rows[0].id);
        return result.rows[0].id;
    } catch (error) {
        console.error('Error in registerUser:', error);
        if (error.code === '23505') { // unique_violation error code
            throw new Error('Username or email already exists');
        }
        throw error;
    }
};

module.exports = {
    registerUser,
};
*/

const registerUser = async (username, email, password) => {
    console.log('registerUser function called with:', { username, email, password: password ? '[REDACTED]' : undefined });
    try {
        const user = new User(username, email, password);
        user.validate();
        console.log('User validation passed');

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        const query = 'INSERT INTO public.users (username, email, password) VALUES ($1, $2, $3) RETURNING id';
        const values = [username, email, hashedPassword];

        console.log('Executing query:', query);
        console.log('Query values:', values.map((v, i) => i === 2 ? '[REDACTED]' : v));

        const result = await db.query(query, values);
        console.log('Query executed. Result:', result);

        if (result.rows && result.rows[0] && result.rows[0].id) {
            console.log('User inserted into database with ID:', result.rows[0].id);
            return result.rows[0].id;
        } else {
            console.error('Unexpected query result structure:', result);
            throw new Error('Failed to insert user: Unexpected query result');
        }
    } catch (error) {
        console.error('Error in registerUser:', error);
        if (error.code === '23505') { // unique_violation error code
            throw new Error('Username or email already exists');
        }
        throw error;
    }
};

module.exports = {
    registerUser,
};