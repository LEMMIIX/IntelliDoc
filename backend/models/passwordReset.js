const { sendResetEmail } = require('../controllers/modelMailer.js');
const db = require('../../ConnectPostgres');
const user = require('./modelUser.js');
const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/html/reset.html'));
});
router.post('/request-verification', async (req, res) => {
	const { email } = req.body; // Receiving email from JSON body

	try {
		const result = await db.query('SELECT * FROM main.users WHERE email = $1', [email]);
		if (result.rows.length > 0) {
			const verificationKey = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

			await db.query('UPDATE main.users SET verification_key = $1 WHERE email = $2', [verificationKey, email]);

			await sendResetEmail(email, verificationKey, result.rows[0].user_name);
			return res.status(200).json({ message: 'Verification key sent to email' });
		} else {
			return res.status(404).json(  'Email not found' );
		}
	} catch (error) {
		console.error('Error resetting password:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

router.get('/newPassword', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/html/reset.html'));
});

router.post('/newPassword', async (req, res) => {
	const { email, verificationcode, newPassword } = req.body;
	console.log('Email:', email, 'Verification Key:', verificationcode)
    //const newPassword = async (email, verfication_Key, newPassword) => {
	try {
		const result = await db.query('SELECT * FROM main.users WHERE email = $1 AND verification_key = $2', [email, verificationcode]);
		console.log("result "+result.rows);
		if (result.rows.length > 0) {
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			await db.query('UPDATE main.users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
			console.log('Passwort erfolgreich geändert');
			return res.status(200).json({ message: 'Passwort erfolgreich geändert!' });
		}
		else {
			console.log('Email Adresse oder Verifikationscode falsch');
			return res.status(400).json({ message: 'Email Adresse oder Verifikationscode falsch.' });
		}
	} catch (error) {
		console.error('Fehler beim setzen des neuen Passworts', error);
		return res.status(500).json({ message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' });
	}
	
});

module.exports = router;