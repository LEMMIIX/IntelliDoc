const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');
const User = require('./modelUser');
/**
const registerUser = async (user_name, email, password_hash) => {
    const user = new User(user_name, email, password_hash);
    user.validate();

    try {
        const hashedPassword = await bcrypt.hash(password_hash, 10);
        const query = 'INSERT INTO public.users (user_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id';
        const values = [user_name, email, hashedPassword];

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

const registerUser = async (user_name, email, password_hash) => {
    console.log('registerUser function called with:', { user_name, email, password_hash: password_hash ? '[REDACTED]' : undefined });
    try {
        const user = new User(user_name, email, password_hash);
        user.validate();
        console.log('User validation passed');

        const hashedPassword = await bcrypt.hash(password_hash, 10);
        console.log('Password hashed successfully');

        const query = 'INSERT INTO main.users (user_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id';
        const values = [user_name, email, hashedPassword];

        console.log('Executing query:', query);
        console.log('Query values:', values.map((v, i) => i === 2 ? '[REDACTED]' : v));

        const result = await db.query(query, values);
        console.log('Query executed. Result:', result);

        if (result && result.rows && result.rows.length > 0) {
            const userId = result.rows[0].user_id;
            console.log('User inserted into database with ID:', userId);
            return userId;
        } else {
            console.error('Unexpected query result structure:', result);
            throw new Error('Failed to insert user: No ID returned');
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