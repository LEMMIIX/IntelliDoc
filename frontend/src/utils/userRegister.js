/**
 * Die `userRegister`-Funktion führt die Registrierung eines neuen Benutzers durch und navigiert nach erfolgreicher Registrierung zur Login-Seite.
 * @Author Ayoub. 
 */

import prodconfig from "../production-config";

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
