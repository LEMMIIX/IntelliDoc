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
connectDB();

// Sitzung starten f�r einzelne Benutzer
app.use(session({
    secret: 'your_secret_key', // �ndere das zu einem sicheren Schl�ssel
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Setze auf true, wenn du HTTPS verwendest
}));



















app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
