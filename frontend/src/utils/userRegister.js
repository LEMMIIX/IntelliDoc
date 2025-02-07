/**
 * @file userRegister.js - Benutzerregistrierungs-Funktionalität
 * @author Ayoub
 * @description Behandelt den Registrierungsprozess für neue Benutzer
 * 
 * @requires ../production-config
 */

import prodconfig from "../production-config";

/**
 * @function userRegister
 * @description Registriert einen neuen Benutzer und leitet zur Login-Seite weiter
 * 
 * @param {string} username - Der gewünschte Benutzername
 * @param {string} email - Die E-Mail-Adresse des Benutzers
 * @param {string} password - Das gewählte Passwort
 * @param {Function} navigate - React Router Navigate-Funktion für die Weiterleitung
 * 
 * @throws {Error} Bei fehlgeschlagener Registrierung
 * 
 * @example
 * userRegister('maxmuster', 'max@example.com', 'Passwort123', navigate);
 * 
 * @note Nach erfolgreicher Registrierung wird der Benutzer zur Login-Seite
 * weitergeleitet und aufgefordert, sich anzumelden.
 */
export function userRegister(username, email, password, navigate) {
  fetch(`${prodconfig.backendUrl}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  })
    .then((response) => {
      console.log(response);
      response.json();
    })
    .then((data) => {
      console.log(data);
      console.log("Success:", data);

      alert("Registrierung erfolgreich! Bitte logge dich ein.");
      navigate("/auth/login");

      // window.location.href = '/dashboard';
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
    });
}
