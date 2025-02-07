/**
 * @file Setpassword.jsx - Passwort-Reset-Komponente
 * @author Ayoub
 * @description Komponente zum Zurücksetzen des Benutzerpassworts nach 
 * Verifizierung durch einen per E-Mail zugesendeten Code.
 * 
 * @requires react
 * @requires react-router-dom
 * @requires ../production-config
 * @requires ../styles/setpassword.css
 * @requires ../assets/intellidoc_logo.webp
 */

import React, { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import prodconfig from "../production-config";
import '../styles/setpassword.css';
import intellidoc_logo from '../assets/intellidoc_logo.webp';

/**
 * @typedef {Object} SetPasswordState
 * @property {string} email - E-Mail-Adresse des Benutzers
 * @property {string} verificationcode - Verifizierungscode aus der E-Mail
 * @property {string} newPassword - Neues Passwort des Benutzers
 * @property {string} message - Statusnachricht für den Benutzer
 */

/**
 * @component Setpassword
 * @description Komponente zur Eingabe eines neuen Passworts nach erfolgreicher
 * Verifizierung. Ermöglicht die Eingabe von E-Mail, Verifizierungscode und neuem Passwort.
 * 
 * @returns {JSX.Element} Die gerenderte Setpassword-Komponente
 */
function Setpassword() {
    const [email, setEmail] = useState('');
    const [verificationcode, setVerificationKey] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Handle form submission
    /**
 * @function handleSubmit
 * @description Verarbeitet die Formular-Übermittlung für das Setzen des neuen Passworts
 * @async
 * @param {Event} event - Das Submit-Event des Formulars
 * @throws {Error} Wenn die Server-Anfrage fehlschlägt
 * @returns {Promise<void>}
 */
    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = { email, verificationcode, newPassword };

        try {
            const response = await fetch(`${prodconfig.backendUrl}/passwordReset/newPassword`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setMessage('Passwort wurde erfolgreich zurückgesetzt!');
                navigate('/auth/login');
            } else {
                setMessage('Fehler: ' + (await response.text()));
                navigate('/auth/login');
            }
        } catch (error) {
            setMessage('Fehler: ' + error.message);
        }
    };

    return (
        <>
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <a href="/">
                            <img src={intellidoc_logo} alt="IntelliDoc Logo" />
                        </a>
                    </div>
                </div>
            </header>
            {/* Main Content */}
            <div className="setpassword_page">
                <div className="setpassword_container">
                    <h1>Passwort zurücksetzen</h1>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email">E-Mail:</label>
                        <input
                            className="setpassword_input"
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label htmlFor="verificationKey">Verifizierungsschlüssel:</label>
                        <input
                            className="setpassword_input"
                            type="text"
                            id="verificationKey"
                            name="verificationKey"
                            value={verificationcode}
                            onChange={(e) => setVerificationKey(e.target.value)}
                            required
                        />
                        <label htmlFor="newPassword">Neues Passwort:</label>
                        <input
                            className="setpassword_input"
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button className="setpassword_button" type="submit">Zurücksetzen</button>
                    </form>
                    {message && <p className="setpassword_message">{message}</p>}
                </div>
            </div>
        </>
    );

}

export default Setpassword;
