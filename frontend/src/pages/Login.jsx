/**
 * @file Login.jsx - Benutzerauthentifizierung Komponente
 * @author Ilyass
 * @description Diese Komponente ermöglicht Benutzern das Einloggen in die Anwendung 
 * und bietet eine Option zum Zurücksetzen des Passworts.
 * 
 * @requires react
 * @requires react-router-dom
 * @requires ../utils/userLogin
 * @requires ../styles/Signup.css
 * @requires ../assets/intellidoc_logo.webp
 */

import { useState } from "react"; // Importing useState hook to manage component state
import { userLogin } from "../utils/userLogin"; // Importing the userLogin function from utils
import { Link, useNavigate } from "react-router-dom"; // Importing Link for navigation and useNavigate for programmatic navigation
import "../styles/Signup.css"; // Importing CSS styles for the component
import intellidoc_logo from "../assets/intellidoc_logo.webp";

/**
 * @typedef {Object} LoginState
 * @property {string} email - Die E-Mail-Adresse des Benutzers
 * @property {string} password - Das Passwort des Benutzers
 */

/**
 * @component Login
 * @description Login-Komponente die das Anmeldeformular und die Navigation zur Registrierung bereitstellt.
 * Verwaltet den Anmeldeprozess und bietet Optionen für Passwort-Reset.
 * 
 * @returns {JSX.Element} Die gerenderte Login-Komponente
 */
function Login() {
  const navigate = useNavigate(); // Initializing navigate function to redirect users
  const [email, setEmail] = useState(""); // State to manage the username input
  const [password, setPassword] = useState(""); // State to manage the password input

  // Handle form submission
  /**
 * @function handleSubmit
 * @description Verarbeitet die Formular-Übermittlung für den Login-Prozess
 * @param {Event} e - Das Submit-Event des Formulars
 * @returns {void}
 */
  const handleSubmit = (e) => {
    e.preventDefault(); // Preventing the default form submission behavior

    // Calling the userLogin function to log in the user
    userLogin(email, password, navigate);
  };

    return (

        <>

            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <a href="/">
                            <img src={intellidoc_logo} alt="IntelliDoc Logo" />
                        </a>
                    </div>
                </div>
            </header>

        <div className="signup-container">
            <div className="signup-card">
                {/* Linke Spalte: Login */}
                <div className="signup-column">
                    <h1>Einloggen</h1>
                    <form onSubmit={handleSubmit}>
                        
                        <input
                            type="email"
                            placeholder="E-Mail-Adresse"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Passwort"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit">Login</button>
                        {/* Passwort zurücksetzen Button */}
                        <Link to="/Requestpassword" className="reset-password-link">

                            Passwort vergessen
                        </Link>
                    </form>
                </div>

                {/* Rechte Spalte: Registrierung */}
                <div className="login-column">
                    <h2>Neu hier?</h2>
                    <h3>Erstelle ein neues Konto und lege sofort los!</h3>
                    <Link to="/auth/signup">Registrieren</Link>
                </div>
            </div>
            </div>
        </>
            );
    
}

export default Login; // Exporting the Login component for use in other parts of the application
