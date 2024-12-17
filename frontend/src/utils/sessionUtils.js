/**
 * Die `getCurrentUser`-Funktion ruft den aktuell angemeldeten Benutzer vom Backend ab und gibt dessen Benutzer-ID zurück.
 * @Author Farah.
 */

import { customFetch } from "./helpers";
import prodconfig from "../production-config";

export function getCurrentUser() {
  return customFetch(`${prodconfig.backendUrl}/api/current-user`)
    .then((response) => {
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to get current user");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      return data.userId;
    })
    .catch((error) => {
      console.error("Error getting current user:", error);
      return null;
    });
}
