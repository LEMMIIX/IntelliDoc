/**
 * @file userLogout.js - Benutzerabmeldungs-Funktionalität
 * @author Farah
 * @description Behandelt den Abmeldeprozess und das Bereinigen der Session-Daten
 * 
 * @requires ../production-config
 */

import prodconfig from "../production-config";

/**
 * @function userLogout
 * @async
 * @description Führt die Benutzerabmeldung durch, bereinigt Session-Informationen
 * und leitet zur Login-Seite weiter
 * 
 * @param {Function} navigate - React Router Navigate-Funktion für die Weiterleitung
 * @throws {Error} Bei fehlgeschlagener Abmeldung am Server
 * 
 * @example
 * await userLogout(navigate);
 * 
 * @note Bereinigt folgende Daten aus dem localStorage:
 * - currentUserId
 * - currentUserName
 */
export async function userLogout(navigate) {
  try {
    const response = await fetch(`${prodconfig.backendUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Kann jetzt nicht abmelden, versuche es später!");
    }
    const data = await response.json();
    console.log(data);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserName");
    navigate("/auth/login");
  } catch (err) {
    console.log(err);
  }
}
