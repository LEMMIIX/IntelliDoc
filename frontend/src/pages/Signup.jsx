import { useState } from "react";
import { userRegister } from "../utils/userRegister";
import { Link, useNavigate } from "react-router-dom";
import "../styles/index.css"


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
      <main className="login_page">
         <div className="login_container">
            <img src="../../../public/intelliDoc.jpeg" className="logo" /> 
            {/* Logo-Bild */}
            <Link to='/' className="login_homepage_link">
               <img src="../../../public/homepage.png" className="homepage_icon" />
               {/* Startseite-Icon */}
            </Link>
            <form className="login_form" onSubmit={handleSubmit}>
               <div className="login_input_container">
                  <label htmlFor="username" className="login_input_label">Benutzername:</label>
                  <input
                     type="text" // Eingabetyp für den Benutzernamen
                     name="username" // Name-Attribut des Eingabefelds
                     className="login_input" // CSS-Klasse für die Gestaltung
                     value={username} // Bindung des Eingabewerts an den Status
                     onChange={(e)=>setUsername(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
                     required // Markieren dieses Feldes als erforderlich
                  />
               </div>
               <div className="login_input_container">
                  <label htmlFor="email" className="login_input_label">E-Mail-Adresse:</label>
                  <input
                     type="email" // Eingabetyp für die E-Mail-Adresse
                     name="email" // Name-Attribut des Eingabefelds
                     className="login_input" // CSS-Klasse für die Gestaltung
                     value={email} // Bindung des Eingabewerts an den Status
                     onChange={(e)=>setEmail(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
                     required // Markieren dieses Feldes als erforderlich
                  />
               </div>
               <div className="login_input_container">
                  <label htmlFor="password" className="login_input_label">Passwort:</label>
                  <input
                     type="password" // Eingabetyp für das Passwort
                     name="password" // Name-Attribut des Eingabefelds
                     className="login_input" // CSS-Klasse für die Gestaltung
                     value={password} // Bindung des Eingabewerts an den Status
                     onChange={(e)=>setPassword(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
                     required // Markieren dieses Feldes als erforderlich
                  />
               </div>
               <div className="login_input_container">
                  <label htmlFor="password2" className="login_input_label">Bestätigen Sie Ihr Passwort:</label>
                  <input
                     type="password" // Eingabetyp für die Passwortbestätigung
                     name="password2" // Name-Attribut des Eingabefelds
                     className="login_input" // CSS-Klasse für die Gestaltung
                     value={password2} // Bindung des Eingabewerts an den Status
                     onChange={(e)=>setPassword2(e.target.value)} // Aktualisierung des Status bei Änderung der Eingabe
                     required // Markieren dieses Feldes als erforderlich
                  />
               </div>
               <button type="submit" className="button">
                  Registrieren
               </button>
               <div className="login_signup_question">
                  <p>Haben Sie bereits ein Konto?</p>
                  <Link to='/login'className="text-blue-500"> 
                     Einloggen
                  </Link>
               </div>
            </form>
         </div>
      </main>
   );
}

export default Signup;
