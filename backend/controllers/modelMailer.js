/**
 * @fileoverview Diese Datei enthält Funktionen zum Versenden von E-Mails mit Nodemailer.
 * Sie ermöglicht das Versenden von Bestätigungs- und Zurücksetzungs-E-Mails an Benutzer.
 * 
 * @author Ayoub, erweitert von Lennart
 */

const nodemailer = require('nodemailer');
const dotenv = require("dotenv-safe");
const path = require("path");

dotenv.config({
    allowEmptyValues: true,
    example: path.join(__dirname, '../../frontend/.env.template')
});

let transporter = null;

/**
 * Überprüft, ob die erforderlichen E-Mail-Konfigurationswerte gesetzt sind.
 * 
 * @function isEmailConfigured
 * @returns {boolean} Gibt `true` zurück, wenn die E-Mail-Konfiguration vollständig ist, andernfalls `false`.
 * @example
 * if (isEmailConfigured()) {
 *   console.log("E-Mail-Versand ist konfiguriert.");
 * }
 */
function isEmailConfigured() {
   return !!(process.env.GMAIL_USER && 
       process.env.GMAIL_APP_PASSKEY && 
       process.env.SMTP_HOST && 
       process.env.SMTP_PORT);
}

/**
 * Initialisiert den Nodemailer-Transporter für den E-Mail-Versand.
 * Falls die Konfiguration unvollständig ist, wird der Transporter nicht erstellt.
 * 
 * @function initializeTransporter
 * @throws {Error} Falls ein Fehler bei der Initialisierung des Transporters auftritt.
 */
function initializeTransporter() {
   if (!isEmailConfigured()) {
       console.warn('Email configuration incomplete - email features will be disabled');
       return;
   }
   
   try {
       transporter = nodemailer.createTransport({
           host: process.env.SMTP_HOST,
           port: parseInt(process.env.SMTP_PORT),
           secure: false,
           auth: {
               user: process.env.GMAIL_USER,
               pass: process.env.GMAIL_APP_PASSKEY
           }
       });
       console.log('Email transport initialized successfully');
   } catch (error) {
       console.error('Failed to initialize email transport:', error);
       transporter = null;
   }
}

/**
 * Sendet eine Bestätigungs-E-Mail mit einem Verifizierungscode an einen Benutzer.
 * 
 * @async
 * @function sendVerificationEmail
 * @param {string} email - Die E-Mail-Adresse des Empfängers.
 * @param {string} verification_Key - Der Verifizierungscode.
 * @param {string} user_name - Der Name des Benutzers.
 * @returns {Promise<{success: boolean, messageId?: string, reason?: string, message?: string, error?: string}>}
 * Ein Objekt, das den Erfolg oder Misserfolg des E-Mail-Versands angibt.
 * @throws {Error} Falls ein Fehler beim Senden der E-Mail auftritt.
 * @example
 * const result = await sendVerificationEmail("test@example.com", "123456", "Max Mustermann");
 * if (result.success) {
 *   console.log("Bestätigungs-E-Mail gesendet:", result.messageId);
 * } else {
 *   console.error("Fehler beim Senden:", result.message);
 * }
 */
async function sendVerificationEmail(email, verification_Key, user_name) {
   if (!transporter) {
       return {
           success: false,
           reason: 'email_not_configured',
           message: 'Email service is not configured'
       };
   }
   
   const mailOptions = {
       from: process.env.GMAIL_USER,
       to: email,
       subject: 'IntelliDoc Bestätigungscode',
       text: `Your verification key is: ${verification_Key}`,
       html: `<html>
               <head>
                   <meta charset="UTF-8">
                   <title>Bestätigungscode</title>
               </head>
               <body>
                   <h2>Willkommen bei Intellidoc, ${user_name}!</h2>
                   <p>Vielen Dank, dass Sie sich bei Intellidoc registriert haben.</p>
                   <p>Um Ihre E-Mail-Adresse zu bestätigen, geben Sie bitte den folgenden Bestätigungscode ein:</p>
                   <h3 style="color: blue;">${verification_Key}</h3>
                   <p>Wenn Sie sich nicht für Intellidoc registriert haben, ignorieren Sie bitte diese E-Mail.</p>
                   <br>
                   <p>Mit freundlichen Grüßen,<br>Das Intellidoc-Team</p>
               </body>
           </html>`
   };
   
   try {
       const info = await transporter.sendMail(mailOptions);
       console.log('Verification email sent:', info.messageId);
       return {
           success: true,
           messageId: info.messageId
       };
   } catch (error) {
       console.error('Error sending verification email:', error);
       return {
           success: false,
           reason: 'send_failed',
           message: 'Failed to send email',
           error: error.message
       };
   }
}

/**
 * Sendet eine E-Mail zum Zurücksetzen des Passworts mit einem Verifizierungscode.
 * 
 * @async
 * @function sendResetEmail
 * @param {string} email - Die E-Mail-Adresse des Empfängers.
 * @param {string} verification_Key - Der Verifizierungscode.
 * @param {string} user_name - Der Name des Benutzers.
 * @returns {Promise<{success: boolean, messageId?: string, reason?: string, message?: string, error?: string}>}
 * Ein Objekt, das den Erfolg oder Misserfolg des E-Mail-Versands angibt.
 * @throws {Error} Falls ein Fehler beim Senden der E-Mail auftritt.
 * @example
 * const result = await sendResetEmail("test@example.com", "654321", "Max Mustermann");
 * if (result.success) {
 *   console.log("Passwort-Reset-E-Mail gesendet:", result.messageId);
 * } else {
 *   console.error("Fehler beim Senden:", result.message);
 * }
 */
async function sendResetEmail(email, verification_Key, user_name) {
   if (!transporter) {
       return {
           success: false,
           reason: 'email_not_configured',
           message: 'Email service is not configured'
       };
   }

   const mailOptions = {
       from: process.env.GMAIL_USER,
       to: email,
       subject: 'IntelliDoc Passwort zurücksetzen',
       text: `Your verification key is: ${verification_Key}`,
       html: `<html>
               <head>
                   <meta charset="UTF-8">
                   <title>Bestätigungscode</title>
               </head>
               <body>
                   <h2>Hallo ${user_name}!</h2>
                   <p>Um Ihr Passwort zurückzusetzen, geben Sie bitte den folgenden Bestätigungscode ein:</p>
                   <h3 style="color: blue;">${verification_Key}</h3>
                   <p>Wenn Sie kein Passwort-Reset angefordert haben, ignorieren Sie bitte diese E-Mail.</p>
                   <br>
                   <p>Mit freundlichen Grüßen,<br>Das Intellidoc-Team</p>
               </body>
           </html>`
   };

   try {
       const info = await transporter.sendMail(mailOptions);
       console.log('Reset email sent:', info.messageId);
       return {
           success: true,
           messageId: info.messageId
       };
   } catch (error) {
       console.error('Error sending reset email:', error);
       return {
           success: false,
           reason: 'send_failed',
           message: 'Failed to send email',
           error: error.message
       };
   }
}

// Initialize transport on module load
initializeTransporter();

module.exports = { 
   sendVerificationEmail, 
   sendResetEmail,
   isEmailConfigured 
};