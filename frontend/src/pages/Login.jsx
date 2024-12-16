import { useState } from "react"; // Importing useState hook to manage component state
import { userLogin } from "../utils/userLogin"; // Importing the userLogin function from utils
import { Link, useNavigate } from "react-router-dom"; // Importing Link for navigation and useNavigate for programmatic navigation
import "../styles/Signup.css"; // Importing CSS styles for the component

function Login() {
  const navigate = useNavigate(); // Initializing navigate function to redirect users
  const [email, setEmail] = useState(""); // State to manage the username input
  const [password, setPassword] = useState(""); // State to manage the password input

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Preventing the default form submission behavior

    // Calling the userLogin function to log in the user
    userLogin(email, password, navigate);
  };

    return (

        <>

            <header className="header">
                <div className="header-content">
                    <Link to="/" className="logo">IntelliDoc</Link> {/* Text-Logo oder eigenes Logo */}
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
                    <h3>Erstellen Sie ein Konto und legen Sie los!</h3>
                    <Link to="/auth/signup">Registrieren</Link>
                </div>
            </div>
            </div>
        </>
            );
    
}

export default Login; // Exporting the Login component for use in other parts of the application
