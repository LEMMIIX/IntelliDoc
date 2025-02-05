/**
* Diese Datei enthält Funktionen zum Versenden von E-Mails mit Nodemailer.
* Sie ermöglicht das Versenden von Bestätigungs- und Zurücksetzungs-E-Mails an Benutzer.
*
* @author Ayoub, erweitert von Lennart
* Nodemailer webseite. 
*/
const nodemailer = require('nodemailer');
const dotenv = require("dotenv-safe");
const path = require("path");

dotenv.config({
    allowEmptyValues: true,
    example: path.join(__dirname, '../../frontend/.env.template')
});

let transporter = null;

function isEmailConfigured() {
   return !!(process.env.GMAIL_USER && 
       process.env.GMAIL_APP_PASSKEY && 
       process.env.SMTP_HOST && 
       process.env.SMTP_PORT);
}

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