import { useState } from "react";
import { userRegister } from "../utils/userRegister";
import { Link, useNavigate } from "react-router-dom";
import "../styles/index.css";

function Signup() {
  const navigate = useNavigate(); // Initialisierung der navigate-Funktion, um Benutzer weiterzuleiten
  const [username, setUsername] = useState(""); // Status zur Verwaltung der Benutzernamen-Eingabe
  const [email, setEmail] = useState(""); // Status zur Verwaltung der E-Mail-Adresse
  const [password, setPassword] = useState(""); // Status zur Verwaltung der Passworteingabe
  const [password2, setPassword2] = useState(""); // Status zur Verwaltung der Bestätigung des Passworts

  // Formularübermittlung behandeln
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== password2) {
      // Überprüfen, ob die Passwörter übereinstimmen
      alert("Passwords do not match!"); // Warnung bei nicht übereinstimmenden Passwörtern
      return;
    }
    userRegister(username, email, password, navigate); // Aufruf der Funktion userRegister, um den Benutzer zu registrieren
  };

  return (
    <main className="login_page">
      <div className="login_container">
        <img src="../../../public/intelliDoc.jpeg" className="logo" />
        {/* Logo-Bild */}
        <Link to="/" className="login_homepage_link">
          <img src="../../../public/homepage.png" className="homepage_icon" />
          {/* Startseite-Icon */}
        </Link>
        <form className="login_form" onSubmit={handleSubmit}>
          <div className="login_input_container">
            <label htmlFor="username" className="login_input_label">
              Username:
            </label>
            <input
              type="text" // Eingabetyp für den Benutzernamen
              name="username" // Name-Attribut des Eingabefelds
              className="login_input" // CSS-Klasse für die Gestaltung
              value={username} // Bindung des Eingabewerts an den Status
              onChange={(e) => setUsername(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
              required // Markieren dieses Feldes als erforderlich
            />
          </div>
          <div className="login_input_container">
            <label htmlFor="email" className="login_input_label">
              Email address:
            </label>
            <input
              type="email" // Eingabetyp für die E-Mail-Adresse
              name="email" // Name-Attribut des Eingabefelds
              className="login_input" // CSS-Klasse für die Gestaltung
              value={email} // Bindung des Eingabewerts an den Status
              onChange={(e) => setEmail(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
              required // Markieren dieses Feldes als erforderlich
            />
          </div>
          <div className="login_input_container">
            <label htmlFor="password" className="login_input_label">
              Password:
            </label>
            <input
              type="password" // Eingabetyp für das Passwort
              name="password" // Name-Attribut des Eingabefelds
              className="login_input" // CSS-Klasse für die Gestaltung
              value={password} // Bindung des Eingabewerts an den Status
              onChange={(e) => setPassword(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
              required // Markieren dieses Feldes als erforderlich
            />
          </div>
          <div className="login_input_container">
            <label htmlFor="password2" className="login_input_label">
              Confirm your password:
            </label>
            <input
              type="password" // Eingabetyp für die Passwortbestätigung
              name="password2" // Name-Attribut des Eingabefelds
              className="login_input" // CSS-Klasse für die Gestaltung
              value={password2} // Bindung des Eingabewerts an den Status
              onChange={(e) => setPassword2(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
              required // Markieren dieses Feldes als erforderlich
            />
          </div>
          <button type="submit" className="button">
            Sign up
          </button>
          <div className="login_signup_question">
            <p>Do you already have an account?</p>
            <Link to="/login" className="text-blue-500">
              Log in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Signup;
