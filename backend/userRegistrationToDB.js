const db = require('../ConnectPostgres');
/**
 * Dieses model schreibt, bei Registrierungsanfrage, den user in die Datenbank "intellidocdb", in den table "main.users"
 */

// Sendet SQL Anfrage an die DB über die "ConnectPostgres" connection, um den
// neuen user mit seinen Werten einzutragen
const userRegistrationToDB = {
    async registerUser(user_name, email, hashedPassword, verificationKey) {
        const query = `
            INSERT INTO main.users (user_name, email, password_hash, verification_key, is_verified)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id;
        `;
        const values = [user_name, email, hashedPassword, verificationKey, false];

        try {
            const result = await db.query(query, values);
            return result.rows[0].user_id;
        } catch (error) {
            if (error.constraint === 'users_email_key') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    },

    // Evtl. mehr DB Operationen für die Registrierung hier, wenn wir das benötigen
    // |
    // V
    async emailExists(email) {
        const query = 'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)';
        const result = await db.query(query, [email]);
        return result.rows[0].exists;
    }
};

module.exports = userRegistrationToDB;