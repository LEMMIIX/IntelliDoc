const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const { registerUser } = require('./backend/models/userRegistrationToDB');
const { authenticateUser } = require('./backend/models/userAuthenticationToDB');
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

// Registrierung Route
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
        } else if (error.message === 'Failed to insert user: No ID returned') {
            res.status(500).json({ message: 'User was created but an error occurred. Please contact support.' });
        } else {
            res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
        }
    }
});

// Login Route
app.post('/login', async (req, res) => {
    console.log('Received login request:', { ...req.body, password: '[REDACTED]' });
    const { username, password } = req.body;

    try {
        const user = await authenticateUser(username, password);
        if (user) {
            req.session.userId = user.id; // Store user ID in session
            console.log('User logged in successfully:', user.id);
            res.status(200).json({ message: 'Login successful', userId: user.id });
        } else {
            console.log('Login failed: Invalid credentials');
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});