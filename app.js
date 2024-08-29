const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const { registerUser } = require('./backend/models/userRegistrationToDB');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/backend', express.static(path.join(__dirname, 'backend')));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'html', 'login.html'));
});

// Sitzung starten für einzelne Benutzer
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Handle registration
app.post('/register', async (req, res) => {
    console.log('Received registration request:', req.body);
    const { username, email, password } = req.body;

    try {
        const userId = await registerUser(username, email, password);
        console.log('User registered successfully:', userId);
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
    console.log(`Server läuft auf Port ${PORT}`);
});