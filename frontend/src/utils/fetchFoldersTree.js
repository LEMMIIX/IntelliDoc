/**
 * @file fetchFoldersTree.js - Utility-Funktionen für Ordnerstruktur-Abfragen
 * @author Farah
 * @description Funktionen zum Abrufen der Ordnerstruktur vom Backend-Server
 * 
 * @requires ./helpers
 * @requires ../production-config
 */

import { customFetch } from "./helpers";
import prodconfig from "../production-config";

/**
 * @function fetchAndRenderFolderTree
 * @async
 * @description Ruft die komplette hierarchische Ordnerstruktur vom Server ab
 * @throws {Error} Wenn die Server-Anfrage fehlschlägt
 * @returns {Promise<Object>} Die Ordnerstruktur als verschachteltes Objekt
 */
export async function fetchAndRenderFolderTree() {
  try {
    const response = await customFetch(
      `${prodconfig.backendUrl}/folders/tree`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    console.log(response);
    if (!response.ok) {
      throw new Error("Fehler beim Abrufen der Ordnerstruktur");
    }

    const folderTree = await response.json();
    return folderTree;
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * @function fetchAndRenderFolder
 * @async
 * @description Ruft die Basis-Ordnerstruktur ohne Hierarchie vom Server ab
 * @throws {Error} Wenn die Server-Anfrage fehlschlägt
 * @returns {Promise<Object>} Die Basis-Ordnerstruktur als Objekt
 */
export async function fetchAndRenderFolder() {
  try {
    const response = await customFetch(`${prodconfig.backendUrl}/folders`, {
      method: "GET",
      credentials: "include",
    });
    console.log(response);
    if (!response.ok) {
      throw new Error("Fehler beim Abrufen der Ordnerstruktur");
    }

    const folderTree = await response.json();
    return folderTree;
  } catch (error) {
    console.error("Error:", error);
  }
}
