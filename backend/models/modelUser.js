/**
 * @fileoverview Diese Datei enthält die Definition der User-Klasse.
 * Sie ermöglicht die Erstellung und Validierung von Benutzerobjekten.
 * 
 * @author Ayoub
 */

/**
 * Repräsentiert einen Benutzer mit Benutzername, E-Mail und Passwort.
 * 
 * @class User
 * @property {string} username - Der Benutzername des Users.
 * @property {string} email - Die E-Mail-Adresse des Users.
 * @property {string} password - Das Passwort des Users.
 */
class User {

    /**
     * Erstellt eine neue Instanz eines Benutzers.
     * 
     * @constructor
     * @param {string} username - Der Benutzername.
     * @param {string} email - Die E-Mail-Adresse.
     * @param {string} password - Das Passwort.
     */
    constructor(username, email, password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    /**
 * Überprüft, ob alle erforderlichen Felder (`username`, `email`, `password`) vorhanden sind.
 * 
 * @method validate
 * @memberof User
 * @throws {Error} Falls ein erforderliches Feld fehlt.
 * @example
 * const user = new User("testuser", "test@example.com", "securepassword");
 * user.validate(); // Kein Fehler
 */
    validate() {
        if (!this.username || !this.email || !this.password) {
            throw new Error('Username, email, and password are required');
        }


    }
}

module.exports = User;