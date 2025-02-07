/**
 * @file Verification.jsx - E-Mail-Verifizierungs-Komponente
 * @author Ayoub
 * @description Komponente zur Verifizierung der E-Mail-Adresse nach der Registrierung
 * durch Eingabe eines zugesendeten Verifizierungscodes.
 * 
 * @requires react
 * @requires react-router-dom
 * @requires ../production-config
 * @requires ../styles/verification.css
 * @requires ../assets/intellidoc_logo.webp
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import prodconfig from "../production-config";
import "../styles/verification.css";
import intellidoc_logo from "../assets/intellidoc_logo.webp";

/**
 * @typedef {Object} VerificationState
 * @property {string} email - E-Mail-Adresse aus dem Router-State
 * @property {string} verificationCode - Eingabewert des Verifizierungscodes
 */

/**
 * @component Verification
 * @description Komponente zur E-Mail-Verifizierung. Verarbeitet den über
 * react-router-dom übergebenen Location-State für die E-Mail-Adresse und
 * ermöglicht die Eingabe des Verifizierungscodes.
 * 
 * @returns {JSX.Element} Die gerenderte Verification-Komponente
 */
function Verification() {
    const location = useLocation(); // Verwendet die location-API von react-router-dom
    const email = location.state?.email || ""; 
    const [verificationCode, setVerificationCode] = useState("");
    const navigate = useNavigate();

    /**
 * @function handleVerification
 * @description Verarbeitet die Verifizierung des eingegebenen Codes
 * @async
 * @throws {Error} Bei fehlgeschlagener API-Anfrage
 * @returns {Promise<void>}
 */
    const handleVerification = async () => {
        try {
            const response = await fetch(`${prodconfig.backendUrl}/api/verify-code`, { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email, // E-Mail dynamisch verwenden
                    verificationCode,
                }),
            });
            if (response.status === 200) {
                // Verifizierung erfolgreich
                alert("Verifizierung erfolgreich!");
                navigate("/auth/login");
            } else if (response.status === 400) {
                // Wenn es einen Fehler bei der Verifizierung gab
                const data = await response.json();
                alert(data.message || "Ungültiger Verifizierungscode.");
            } else {
                // Fehlerhafte HTTP-Antwort
                alert("Fehler bei der Verifizierung. Bitte versuchen Sie es erneut.");
            }
        } catch (error) {
            console.error("Fehler:", error);
            alert("Ein unerwarteter Fehler ist aufgetreten.");
        }
    };

    return (
        <main className="verification_page">
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <a href="/">
                            <img src={intellidoc_logo} alt="IntelliDoc Logo" />
                        </a>
                    </div>
                </div>
            </header>
            <div className="verification_container">
                <h1>Verifizierung erforderlich</h1>
                <p>Bitte überprüfen Sie Ihre E-Mail-Adresse und geben Sie den Verifizierungscode ein.</p>
                <div>
                    <input
                        type="email"
                        placeholder="E-Mail-Adresse"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="verification_input"
                    />
                    <input
                        type="text"
                        placeholder="Verifizierungscode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="verification_input"
                    />
                    <button onClick={handleVerification} className="verification_button">
                        Bestätigen
                    </button>
                </div>

            </div>
        </main>
    );
}

export default Verification;

