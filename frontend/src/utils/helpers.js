/**
 * @file helpers.js - Utility-Funktionen für die Ordnerstruktur und Authentifizierung
 * @author Farah
 * @description Sammlung von Hilfsfunktionen für die Navigation in der Ordnerstruktur
 * und authentifizierte API-Aufrufe
 */

/**
 * @function getFolderContent
 * @description Durchsucht rekursiv den Ordnerbaum nach einem spezifischen Ordner
 * und gibt dessen Inhalt zurück
 * 
 * @param {Array<Object>} folderTree - Der zu durchsuchende Ordnerbaum
 * @param {string|number} folderId - Die ID des gesuchten Ordners
 * @param {string} [path=""] - Der aktuelle Pfad (wird für die Rekursion verwendet)
 * 
 * @returns {Object|null} Ein Objekt mit Pfad, Dateien und Unterordnern oder null
 * @property {string} folderPath - Der vollständige Pfad zum Ordner
 * @property {Array} files - Die Dateien im Ordner
 * @property {Array} children - Die Unterordner
 */
export function getFolderContent(folderTree, folderId, path = "") {
  for (let folder of folderTree) {
    const currentPath =` ${path}/${folder.name}`;
    if (folder.id == folderId) {
      return {
        folderPath: currentPath,
        files: folder.files,
        children: folder.children,
      };
    }
    if (folder.children && folder.children.length > 0) {
      const result = getFolderContent(folder.children, folderId, currentPath);
      console.log("result", result);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

/**
 * @function customFetch
 * @async
 * @description Erweitert die native Fetch-API um Authentifizierung und Session-Handling
 * 
 * @param {string} url - Die URL für den API-Aufruf
 * @param {Object} [options={}] - Fetch-Optionen
 * @throws {Response} Bei 401 wird die Session beendet und zur Login-Seite weitergeleitet
 * @returns {Promise<Response>} Die Server-Antwort
 */
export const customFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  // Check if the response is unauthorized
  if (response.status === 401) {
    // Token expired or invalid session
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserName");

    // alert("Please Login in again, votre session is finished.");
    window.location.href = "/auth/login"; // Redirect to login
  }

  return response;
};

/**
 * @function getPathID
 * @description Sucht rekursiv nach einem Ordner anhand seines Namens und gibt dessen ID zurück
 * 
 * @param {Array<Object>} folderTree - Der zu durchsuchende Ordnerbaum
 * @param {string} path - Der Name des gesuchten Ordners
 * 
 * @returns {string|number|null} Die ID des gefundenen Ordners oder null
 */
export function getPathID(folderTree, path) {
  for (let folder of folderTree) {
    console.log("folder", folder);
    if (folder.name == path) {
      return folder.id;
    }
    if (folder.children && folder.children.length > 0) {
      const result = getPathID(folder.children, path);
      if (result) {
        return result;
      }
    }
  }
  return null;
}