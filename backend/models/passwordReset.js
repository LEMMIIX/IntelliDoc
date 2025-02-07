/**
 * @fileoverview Diese Datei enthält Routen und Funktionen zum Zurücksetzen von Passwörtern.
 * Sie ermöglicht das Anfordern eines Verifikationscodes und das Setzen eines neuen Passworts.
 * 
 * @author Ayoub
 * Der `verificationKey` basiert auf einer Lösung von StackOverflow.
 * @module passwordReset
 */


const { sendResetEmail } = require('../controllers/modelMailer.js');
const db = require('../../ConnectPostgres');
const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');

/**
 * Liefert die HTML-Seite für das Zurücksetzen des Passworts.
 * 
 * @name GET /
 * @function
 * @memberof passwordReset
 * @param {Object} req - Das Request-Objekt.
 * @param {Object} res - Das Response-Objekt.
 */
router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/html/reset.html'));
});

/**
 * Sendet einen Verifikationscode an die angegebene E-Mail-Adresse, falls sie in der Datenbank existiert.
 * 
 * @name POST /request-verification
 * @function
 * @memberof passwordReset
 * @param {Object} req - Das Request-Objekt mit der `email` im Body.
 * @param {Object} res - Das Response-Objekt zur Rückgabe des Status.
 * @returns {JSON} Erfolgsmeldung oder Fehler, falls die E-Mail nicht existiert.
 * @throws {Error} Falls ein Serverfehler auftritt.
 * @example
 * fetch('/request-verification', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com' })
 * })
 * .then(response => response.json())
 * .then(data => console.log(data));
 */
router.post('/request-verification', async (req, res) => {
	const { email } = req.body; // emai vom JSON body erhalten

	try {
		const result = await db.query('SELECT * FROM main.users WHERE email = $1', [email]);
		if (result.rows.length > 0) {
			const verificationKey = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

			await db.query('UPDATE main.users SET verification_key = $1 WHERE email = $2', [verificationKey, email]);

			await sendResetEmail(email, verificationKey, result.rows[0].user_name);
			return res.status(200).json({ message: 'Verification key sent to email' });
		} else {
			return res.status(404).json('Email not found');
		}
	} catch (error) {
		console.error('Error resetting password:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

/**
 * Liefert die HTML-Seite zum Setzen eines neuen Passworts.
 * 
 * @name GET /newPassword
 * @function
 * @memberof passwordReset
 * @param {Object} req - Das Request-Objekt.
 * @param {Object} res - Das Response-Objekt.
 */
router.get('/newPassword', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend/html/reset.html'));
});

/**
 * Setzt ein neues Passwort für einen Benutzer, wenn der Verifikationscode korrekt ist.
 * 
 * @name POST /newPassword
 * @function
 * @memberof passwordReset
 * @param {Object} req - Das Request-Objekt mit `email`, `verificationcode` und `newPassword` im Body.
 * @param {Object} res - Das Response-Objekt zur Rückgabe des Status.
 * @returns {JSON} Erfolgsmeldung oder Fehler bei ungültigem Code oder fehlgeschlagener Änderung.
 * @throws {Error} Falls ein Serverfehler auftritt.
 * @example
 * fetch('/newPassword', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     verificationcode: '123456',
 *     newPassword: 'newSecurePassword123'
 *   })
 * })
 * .then(response => response.json())
 * .then(data => console.log(data));
 */
router.post('/newPassword', async (req, res) => {
	const { email, verificationcode, newPassword } = req.body;
	console.log('Email:', email, 'Verification Key:', verificationcode)
	//const newPassword = async (email, verfication_Key, newPassword) => {
	try {
		const result = await db.query('SELECT * FROM main.users WHERE email = $1 AND verification_key = $2', [email, verificationcode]);
		console.log("result " + result.rows);
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