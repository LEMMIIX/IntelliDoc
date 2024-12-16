import { useState } from "react";
import { userRegister } from "../utils/userRegister";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Signup.css"


function Signup() {
   
   const navigate = useNavigate(); // Initialisierung der navigate-Funktion, um Benutzer weiterzuleiten
   const [username, setUsername] = useState(""); // Status zur Verwaltung der Benutzernamen-Eingabe
   const [email, setEmail] = useState(""); // Status zur Verwaltung der E-Mail-Adresse
   const [password, setPassword] = useState(""); // Status zur Verwaltung der Passworteingabe
   const [password2, setPassword2] = useState(""); // Status zur Verwaltung der Bestätigung des Passworts

  
   // Formularübermittlung behandeln
   const handleSubmit = (e) => {
       e.preventDefault();
       // Passwortanforderungen im Frontend
       const passwordMinLength = 8;
       const passwordRegex = /[A-Z]/; // muss mindestens einen Großbuchstaben enthalten
       if (password.length < passwordMinLength) { // Überprüfen, ob das Passwort die Mindestlänge erfüllt
           alert(`Das Passwort muss mindestens ${passwordMinLength} Zeichen lang sein.`);
           return;
       }
       if (!password.match(passwordRegex)) { // Überprüfen, ob das Passwort mindestens einen Großbuchstaben enthält
           alert("Das Passwort muss mindestens einen Großbuchstaben enthalten.");
           return;
       }

      if (password !== password2) { // Überprüfen, ob die Passwörter übereinstimmen
         alert("Passwörter stimmen nicht überein!"); // Warnung bei nicht übereinstimmenden Passwörtern
         return;
      }
       userRegister(username, email, password, () => {
           // Nach erfolgreicher Registrierung den Benutzer zur Verifizierungsseite weiterleiten
           navigate('/Verification', { state: { email } });
       }); // Aufruf der Funktion userRegister, um den Benutzer zu registrieren
   };

    return (
        <>
        
            <header className="header">
                <div className="header-content">
                    <Link to="/" className="logo">IntelliDoc</Link> {/* Text-Logo oder eigenes Logo */}
                </div>
            </header>
            {/* Hauptinhalt */}
        <div className="signup-container">
            <div className="signup-card">
                {/* Linke Spalte: Registrierung */}
                <div className="signup-column">
                    <h1>Registrieren</h1>
                    <h3>Bitte alle Felder ausfüllen</h3>
                    <form onSubmit={handleSubmit}>
                        
                        <input
                            type="text"
                                placeholder="E-Mail-Adresse"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="E-Mail-Adresse bestätigen"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Passwort"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Passwort bestätigen"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                        />
                        <button type="submit">Registrieren</button>
                    </form>
                </div>

                {/* Rechte Spalte: Login */}
                <div className="login-column">
                    <h2>Willkommen zurück!</h2>
                    <h3>Schön, wieder da zu sein!</h3>
                    <Link to="/login">Einloggen</Link>
                </div>
            </div>
            
            </div>
        </>
    );
}

export default Signup;
