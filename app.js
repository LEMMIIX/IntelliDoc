const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const connectDB = require('./ConnectPostgres')
const PORT = process.env.PORT || 3000;



// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Postgre Verbindung herstellen. 
//connectDB();

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/html', 'login.html'));
});

// Sitzung starten f�r einzelne Benutzer
app.use(session({
    secret: 'your_secret_key', // �ndere das zu einem sicheren Schl�ssel
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Setze auf true, wenn du HTTPS verwendest
}));

// Handle registration
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userId = await modelUser.createUser(username, email, password);
        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.message === 'Username or email already exists') {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    }
});

















app.listen(PORT, () => {
    console.log(`Server l�uft auf Port ${PORT}`);
});
