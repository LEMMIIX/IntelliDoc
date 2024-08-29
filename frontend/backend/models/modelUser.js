const bcrypt = require('bcrypt');
const db = require('.../ConnectPostgres');

const createUser = async (username, email, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO public.users (username, email, password) VALUES ($1, $2, $3) RETURNING id';
    const values = [username, email, hashedPassword];

    try {
        const result = await db.query(query, values);
        return result.rows[0].id;
    } catch (error) {
        if (error.code === '23505') { // unique_violation error code
            throw new Error('Username or email already exists');
        }
        throw error;
    }
};

module.exports = {
    createUser,
};