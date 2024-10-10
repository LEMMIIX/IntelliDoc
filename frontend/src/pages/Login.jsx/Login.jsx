import { useState } from "react"; // useState-Hook importieren, um den Komponentenstatus zu verwalten
import { userLogin } from "../../utils/userLogin"; // Import der Funktion userLogin aus utils
import { Link, useNavigate } from "react-router-dom"; // Import von Link zur Navigation und useNavigate für programmatische Navigation
import "../../styles/index.css"; // Import der CSS-Stile für die Komponente

function Login() {
  const navigate = useNavigate(); // Initialisierung der navigate-Funktion, um Benutzer weiterzuleiten
  const [username, setUsername] = useState(""); // Status zur Verwaltung der Eingabe des Benutzernamens
  const [password, setPassword] = useState(""); // Status zur Verwaltung der Eingabe des Passworts

  // Formularübermittlung behandeln
  const handleSubmit = (e) => {
    e.preventDefault(); // Verhindern des Standardverhaltens der Formularübermittlung

    // Aufruf der Funktion userLogin, um den Benutzer anzumelden
    userLogin(username, password, navigate);
  };

  return (
    <main className="login_page">
      {" "}
      {/* Hauptcontainer für die Login-Seite */}
      <div className="login_container">
        <img src="../../../public/intelliDoc.jpeg" className="logo" />{" "}
        {/* Logo-Bild */}
        <Link to="/" className="login_homepage_link">
          <img src="../../../public/homepage.png" className="homepage_icon" />{" "}
        </Link>
        <form className="login_form" onSubmit={handleSubmit}>
          <div className="login_input_container">
            <label htmlFor="username" className="login_input_label">
              Benutzername:
            </label>
            <input
              type="text" // Eingabetyp für den Benutzernamen
              name="username" // Name-Attribut für das Eingabefeld
              className="login_input" // CSS-Klasse zur Gestaltung
              value={username} // Bindung des Eingabewerts an den Status
              onChange={(e) => setUsername(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
              required // Markieren dieses Feldes als erforderlich
            />
          </div>
          <div className="login_input_container">
            <label htmlFor="password" className="login_input_label">
              Passwort:
            </label>
            <input
              type="password" // Eingabetyp für das Passwort
              name="password" // Name-Attribut für das Eingabefeld
              className="login_input" // CSS-Klasse zur Gestaltung
              value={password} // Bindung des Eingabewerts an den Status
              onChange={(e) => setPassword(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
              required // Markieren dieses Feldes als erforderlich
            />
          </div>
          <button type="submit" className="button">
            Anmelden
          </button>
          <div className="login_signup_question">
            <p>Haben Sie kein Konto?</p> <Link to="/signup">Registrieren</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Login; // Export der Login-Komponente zur Verwendung in anderen Teilen der Anwendung
