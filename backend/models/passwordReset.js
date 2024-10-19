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
	const { email } = req.body;
	//console.log('Passwort zur�cksetzen f�r E-Mail:', email);

 //const resetPassword = async (email) => {

	try {
		//�berpr�fen ob die angegeben Email in der Datenbank existiert
		const result = await db.query('SELECT * FROM main.users WHERE email = $1', [email]);
		if (result.rows.length > 0) {
			//console.log('Email Adresse gefunden');
			const verfication_Key = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

			await db.query('UPDATE main.users SET verification_key = $1 WHERE email = $2', [verfication_Key, email]);

			await sendResetEmail(email, verfication_Key, result.rows[0].user_name);
		}
		else {
			console.log('Email Adresse nicht gefunden');
			return null;
		}
	} catch (error) {
		console.error('Fehler beim zur�cksetzten des Passworts', error);
		throw error;
	}
	
});

router.get('/newPassword', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/html/reset.html'));
});

router.post('/newPassword', async (req, res) => {
	const { email,verficationkey,newPassword } = req.body;
    //const newPassword = async (email, verfication_Key, newPassword) => {
	try {
		const result = await db.query('SELECT * FROM main.users WHERE email = $1 AND verification_key = $2', [email, verficationkey]);
		if (result.rows.length > 0) {
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			await db.query('UPDATE main.users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
		}
		else {
			console.log('Email Adresse oder Verifikationscode falsch');
			return null;
		}
	} catch (error) {
		console.error('Fehler beim setzen des neuen Passworts', error);
		throw error;
	}
	
});

module.exports = router;