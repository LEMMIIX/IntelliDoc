const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');
const User = require('./modelUser');
const { sendVerificationEmail } = require('../controllers/modelMailer.js');


const registerUser = async (user_name, email, password_hash) => {
    console.log('registerUser function called with:', { user_name, email, password_hash: password_hash ? '[REDACTED]' : undefined });

    try {
        // Generiert einen Verification Key
        const verification_Key = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

        const user = new User(user_name, email, password_hash, verification_Key);
        user.validate();
        console.log('User validation passed');

        const hashedPassword = await bcrypt.hash(password_hash, 10);
        console.log('Password hashed successfully');

        // Query zum Einfügen des neuen Benutzers in die Datenbank
        const query = 'INSERT INTO main.users (user_name, email, password_hash, verification_Key) VALUES ($1, $2, $3, $4) RETURNING user_id';
        const values = [user_name, email, hashedPassword, verification_Key];

        console.log('Executing query:', query);
        console.log('Query values:', values.map((v, i) => i === 2 ? '[REDACTED]' : v));

        // Führt die Query aus
        const result = await db.query(query, values);
        console.log('Query executed. Result:', result);

        if (result && result.rows && result.rows.length > 0) {
            const userId = result.rows[0].user_id;
            console.log('User inserted into database with ID:', userId);

            // Sende die Bestätigungs-E-Mail
            await sendVerificationEmail(email, verification_Key,user_name);
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
