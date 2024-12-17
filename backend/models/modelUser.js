/**
 * Diese Datei enth�lt die Definition der User-Klasse.
 * Sie erm�glicht die Erstellung und Validierung von Benutzerobjekten.
 *
 * @Author Ayoub
 * 
 */

class User {
    constructor(username, email, password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    validate() {
        if (!this.username || !this.email || !this.password) {
            throw new Error('Username, email, and password are required');
        }
        
        
    }
}

module.exports = User;