import backendUrl from "../production-config";
export function userLogin(username, password, navigate) {
  fetch(backendUrl + "/auth/login", {  // Changed from /login
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Login failed");
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
      alert("Login failed. Please try again.");
    });
}
