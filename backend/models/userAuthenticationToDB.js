const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');

const authenticateUser = async (username, password) => {
    console.log('authenticateUser function called with:', { username, password: password ? '[REDACTED]' : undefined });
    
    try {
        // Query to fetch user by username
        const query = 'SELECT * FROM public.users WHERE username = $1';
        const values = [username];

        console.log('Executing query:', query);
        console.log('Query values:', values);

        const result = await db.query(query, values);
        console.log('Query executed. Rows returned:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('No user found with the given username');
            return null;
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {
            console.log('Password is valid. Authentication successful');
            return { id: user.id, username: user.username, email: user.email };
        } else {
            console.log('Invalid password');
            return null;
        }
    } catch (error) {
        console.error('Error in authenticateUser:', error);
        throw error;
    }
};

module.exports = {
    authenticateUser,
};