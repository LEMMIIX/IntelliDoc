/**
 * @file userLogin.js - Benutzeranmeldungs-Funktionalität
 * @author Farah
 * @description Behandelt den Anmeldeprozess und das Session-Management für Benutzer
 * 
 * @requires ../production-config
 */

import prodconfig from "../production-config";

/**
 * @function userLogin
 * @description Führt die Benutzeranmeldung durch, speichert Session-Informationen
 * und leitet zum Dashboard weiter
 * 
 * @param {string} username - Der Benutzername für die Anmeldung
 * @param {string} password - Das Passwort für die Anmeldung
 * @param {Function} navigate - React Router Navigate-Funktion für die Weiterleitung
 * 
 * @throws {Error} Bei fehlgeschlagener Anmeldung
 * 
 * @example
 * userLogin('benutzer@mail.de', 'passwort123', navigate);
 * 
 * @note Speichert nach erfolgreicher Anmeldung:
 * - currentUserId
 * - currentUserName
 * - isAdmin Status
 * im localStorage
 */
export function userLogin(username, password, navigate) {
  fetch(`${prodconfig.backendUrl}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Anmeldung fehlgeschlagengin failed");
      }
      return response.json();
    })
    .then((data) => {
      localStorage.setItem("currentUserId", data.userId);
      localStorage.setItem("currentUserName", username);
      localStorage.setItem("isAdmin", data.isAdmin); // Store admin status
      navigate("/dashboard");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
    });
}
