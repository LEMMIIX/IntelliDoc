const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Replace with your SMTP port
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'dev.intellidoc@gmail.com', // Replace with your email
        pass: 'rdqs tfnt idfq unbr ' // Replace with your password
    }
});

// Function to send verification email
async function sendVerificationEmail(email, verification_Key, user_name) {
    const mailOptions = {
        from: 'dev.intellidoc@gmail.com',
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
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
}

// Function to send reset email
async function sendResetEmail(email, verification_Key, user_name) {
    const mailOptions = {
        from: 'dev.intellidoc@gmail.com',
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
        return info;
    } catch (error) {
        console.error('Error sending reset email:', error);
        throw new Error('Failed to send reset email');
    }
}

module.exports = { sendResetEmail, sendVerificationEmail };
