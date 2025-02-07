/**
 * @fileoverview Diese Datei enthält Funktionen zur Registrierung von Benutzern 
 * und zur Verifizierung von Verifizierungscodes. Sie ermöglicht das Hinzufügen 
 * neuer Benutzer zur Datenbank und das Senden von Bestätigungs-E-Mails.
 * 
 * @author Ayoub
 * Die Funktionen wurden mit Unterstützung von KI-Tools angepasst und optimiert.
 * @module userRegistrationToDB
 */

const bcrypt = require('bcrypt');
const db = require('../../ConnectPostgres');
const User = require('./modelUser');
const { sendVerificationEmail } = require('../controllers/modelMailer.js');

/**
 * Registriert einen neuen Benutzer, speichert die Anmeldedaten in der Datenbank 
 * und sendet eine Verifizierungs-E-Mail.
 * 
 * @async
 * @function registerUser
 * @param {string} user_name - Der Benutzername des neuen Nutzers.
 * @param {string} email - Die E-Mail-Adresse des neuen Nutzers.
 * @param {string} password_hash - Das gehashte Passwort des Nutzers.
 * @returns {Promise<number>} Die Benutzer-ID des neu registrierten Nutzers.
 * @throws {Error} Falls die Registrierung fehlschlägt oder die E-Mail bereits existiert.
 * @example
 * try {
 *     const userId = await registerUser("MaxMustermann", "max@example.com", "hashedPassword123");
 *     console.log("Benutzer erfolgreich registriert mit ID:", userId);
 * } catch (error) {
 *     console.error("Registrierung fehlgeschlagen:", error.message);
 * }
 */
const registerUser = async (user_name, email, password_hash) => {
    //console.log('registerUser function called with:', { user_name, email, password_hash: password_hash ? '[REDACTED]' : undefined });

    try {

        const verification_Key = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

        const user = new User(user_name, email, password_hash, verification_Key);
        user.validate();


        const hashedPassword = await bcrypt.hash(password_hash, 10);


        // Query zum Einfügen des neuen Benutzers in die Datenbank
        const query = 'INSERT INTO main.users (user_name, email, password_hash, verification_Key) VALUES ($1, $2, $3, $4) RETURNING user_id';
        const values = [user_name, email, hashedPassword, verification_Key];



        // Führt die Query aus
        const result = await db.query(query, values);


        if (result && result.rows && result.rows.length > 0) {
            const userId = result.rows[0].user_id;
            console.log('User inserted into database with ID:', userId);

            // Sende die Bestütigungs-E-Mail
            await sendVerificationEmail(email, verification_Key, user_name);
            return userId;
        } else {
            console.error('Unexpected query result structure:', result);
            throw new Error('Failed to insert user: No ID returned');
        }
    } catch (error) {
        console.error('Error in registerUser:', error);
        if (error.code === '23505') {
            throw new Error('Username or email already exists');
        }
        throw error;
    }
};

/**
 * Überprüft den Verifizierungscode eines Benutzers und setzt den Status auf "verifiziert".
 * 
 * @async
 * @function verifyUserCode
 * @param {string} email - Die E-Mail-Adresse des Benutzers.
 * @param {string} verificationCode - Der vom Benutzer eingegebene Verifizierungscode.
 * @returns {Promise<{ success: boolean, message: string }>} 
 * Ein Objekt, das angibt, ob die Verifizierung erfolgreich war oder nicht.
 * @throws {Error} Falls die Verifizierung fehlschlägt.
 * @example
 * const result = await verifyUserCode("max@example.com", "123456");
 * if (result.success) {
 *     console.log("Verifizierung erfolgreich:", result.message);
 * } else {
 *     console.log("Verifizierung fehlgeschlagen:", result.message);
 * }
 */
const verifyUserCode = async (email, verificationCode) => {
    try {
        // Hole den gespeicherten Verifizierungsschlüssel für die E-Mail
        const query = 'SELECT verification_Key FROM main.users WHERE email = $1';
        const result = await db.query(query, [email]);
        console.log('Database query result:', result.rows);
        if (result.rows.length === 0) {
            return { success: false, message: 'Email not found' };
        }

        const storedKey = result.rows[0].verification_key;
        console.log('storedKey:', storedKey);
        console.log('verificationCode:', verificationCode);
        // Überprüft ob der Schlüssel übereinstimmt
        if (storedKey == verificationCode) {
            // Verifizierung als abgeschlossen markieren
            const updateQuery = 'UPDATE main.users SET is_verified = TRUE WHERE email = $1';
            await db.query(updateQuery, [email]);

            return { success: true, message: 'Verification successful' };
        } else {
            return { success: false, message: 'Invalid verification key TTTT' };
        }
    } catch (error) {
        console.error('Error in verifyUserCode:', error);
        throw new Error('Verification failed');
    }
};

module.exports = {
    registerUser,
    verifyUserCode,
};
