const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');

const authenticateUser = async (user_name, password_hash) => {
    console.log('authenticateUser function called with:', { user_name, password_hash: password_hash ? '[REDACTED]' : undefined });
    
    try {
        // Query to fetch user by user_name
        const query = 'SELECT * FROM main.users WHERE user_name = $1';
        const values = [user_name];

        console.log('Executing query:', query);
        console.log('Query values:', values);

        const result = await db.query(query, values);
        console.log('Query executed. Rows returned:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('No user found with the given user_name');
            return null;
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password_hash, user.password_hash);

        if (isPasswordValid) {
            console.log('Password is valid. Authentication successful');
            return { id: user.user_id, user_name: user.user_name, email: user.email };
        } else {
            console.log('Invalid password_hash');
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