/**
 * @function getPathID
 * @description Sucht rekursiv nach einem Ordner anhand seines Namens und gibt dessen ID zurück
 * 
 * @param {Array<Object>} folderTree - Der zu durchsuchende Ordnerbaum
 * @param {string} path - Der Name des gesuchten Ordners
 * 
 * @returns {string|number|null} Die ID des gefundenen Ordners oder null
 */

import { customFetch } from "./helpers";
import prodconfig from "../production-config";

/**
 * @function getCurrentUser
 * @description Ruft den aktuell angemeldeten Benutzer vom Backend ab
 * 
 * @async
 * @returns {Promise<string|null>} Die Benutzer-ID des aktuellen Benutzers oder null bei Fehler
 * @throws {Error} Wenn die Anfrage fehlschlägt oder der Benutzer nicht authentifiziert ist
 * 
 * @example
 * try {
 *   const userId = await getCurrentUser();
 *   if (userId) {
 *     // Benutzer ist angemeldet
 *   }
 * } catch (error) {
 *   // Fehlerbehandlung
 * }
 */
export function getCurrentUser() {
  return customFetch(`${prodconfig.backendUrl}/api/current-user`)
    .then((response) => {
      console.log(response);
      if (!response.ok) {
        throw new Error("Fehler beim Abrufen des aktuellen Benutzers");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      return data.userId;
    })
    .catch((error) => {
      console.error("Fehler beim Abrufen des aktuellen Benutzers:", error);
      return null;
    });
}
