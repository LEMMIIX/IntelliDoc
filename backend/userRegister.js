/**
 * Diese Datei enth�lt die Route zur Benutzerregistrierung.
 * Sie erm�glicht die Erstellung neuer Benutzer und das Senden von Best�tigungs-E-Mails.
 * und die �berpr�fung der Passwortst�rke.
 *
 * @autor Ayoub  
 * Die Funktionen wurden mit Unterst�tzung von KI tools angepasst und optimiert
 */

const express = require('express');
const router = express.Router();
const { User } = require('./models/modelUser.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail } = require('./models/modelMailer');

function isPasswordValid(password) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return regex.test(password);
}

router.post('/', async (req, res) => {
    const { user_name, email, password } = req.body;

    if (!isPasswordValid(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long and include both letters and numbers.' });
    }

    try {
        //const verificationKey = crypto.randomBytes(20).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ 
            user_name, 
            email, 
            password_hash: hashedPassword, 
            verification_key: verificationKey, 
            is_verified: false 
        });

        await sendVerificationEmail(email, verificationKey);

        res.status(201).json({ message: 'User registered successfully. Please check your email for verification.' });
    } catch (error) {
        console.error('Error registering user:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Email already exists.' });
        }

        if (error.message === 'Failed to send verification email') {
            return res.status(500).json({ error: 'User registered but failed to send verification email. Please contact support.' });
        }

        res.status(500).json({ error: 'Error registering user. Please try again.' });
    }
});

module.exports = router;