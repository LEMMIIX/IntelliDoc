/**
 * @file Requestpassword.jsx - Passwort-Reset-Anforderungskomponente
 * @author Ayoub
 * @description Komponente zum Anfordern einer E-Mail zum Zurücksetzen des Passworts.
 * 
 * @requires react
 * @requires react-router-dom
 * @requires ../production-config
 * @requires ../styles/Requestpassword.css
 * @requires ../assets/intellidoc_logo.webp
 */

import React, { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import prodconfig from "../production-config";
import '../styles/Requestpassword.css';
import intellidoc_logo from '../assets/intellidoc_logo.webp';

/**
 * @typedef {Object} RequestPasswordState
 * @property {string} email - E-Mail-Adresse des Benutzers
 * @property {string} message - Statusnachricht für den Benutzer
 */

/**
 * @component Requestpassword
 * @description Komponente zur Anforderung eines Passwort-Resets.
 * Sendet eine Anfrage an den Server und verarbeitet die Antwort.
 * 
 * @returns {JSX.Element} Die gerenderte Requestpassword-Komponente
 */
function Requestpassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Handle form submission
    /**
 * @function handleSubmit
 * @description Verarbeitet die Formular-Übermittlung für die Passwort-Reset-Anfrage
 * @async
 * @param {Event} event - Das Submit-Event des Formulars
 * @throws {Error} Wenn die Server-Anfrage fehlschlägt
 * @returns {Promise<void>}
 */
    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = { email };

        try {
            const response = await fetch(`${prodconfig.backendUrl}/passwordReset/request-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setMessage('Passwort zurücksetzen E-Mail wurde gesendet!');
                navigate('/Setpassword');
            } else {
                setMessage('' + (await response.text()));
            }
        } catch (error) {
            setMessage('' + error.message);
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
            <div className="requestpassword_page">
                <div className="requestpassword_container">
                    <h1>Passwort zurücksetzen anfordern</h1>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email">E-Mail:</label>
                        <input
                            className="requestpassword_input"
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button className="requestpassword_button" type="submit">Anfordern</button>
                    </form>
                    
                    {message && <p>{message}</p>}
                </div>
            </div>
        </>
    );
}
export default Requestpassword;
