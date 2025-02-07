/**
 * @fileoverview Diese Datei enthält Funktionen zur Authentifizierung von Benutzern.
 * Sie ermöglicht die Überprüfung von E-Mail und Passwort-Hash gegen die Datenbank.
 * 
 * @author Ayoub
 */

const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');

/**
 * Überprüft die Benutzeranmeldeinformationen anhand der Datenbank.
 * 
 * @async
 * @function authenticateUser
 * @param {string} email - Die E-Mail-Adresse des Benutzers.
 * @param {string} password_hash - Der gehashte Passwortwert zur Überprüfung.
 * @returns {Promise<{ id: number, user_name: string, email: string }|null>} 
 * Das Benutzerobjekt, wenn die Authentifizierung erfolgreich ist, sonst `null`.
 * @throws {Error} Falls ein Fehler bei der Datenbankabfrage oder Verarbeitung auftritt.
 * @example
 * const user = await authenticateUser("test@example.com", "hashedPassword123");
 * if (user) {
 *     console.log("Erfolgreich authentifiziert:", user);
 * } else {
 *     console.log("Authentifizierung fehlgeschlagen.");
 * }
 */

const authenticateUser = async (email, password_hash) => {
    //console.log('authenticateUser function called with:', { email, password_hash: password_hash ? '[REDACTED]' : undefined });

    try {
        // Query to fetch user by email
        const query = 'SELECT * FROM main.users WHERE email = $1';
        const values = [email];

        //console.log('Executing query:', query);
        //console.log('Query values:', values);

        const result = await db.query(query, values);
        //console.log('Query executed. Rows returned:', result.rows.length);

        if (result.rows.length === 0) {
            console.log('No user found with the given email');
            return null;
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password_hash, user.password_hash);

        if (isPasswordValid) {
            //console.log('Password is valid. Authentication successful');
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