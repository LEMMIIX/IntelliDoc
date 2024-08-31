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
        
        /*
        * PASSWORT CHECK HIER
        */
    }
}