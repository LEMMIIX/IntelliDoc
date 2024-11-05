const backendUrl = "http://localhost:3000";
export function userLogin(username, password, navigate) {
  fetch(backendUrl + "/login", {
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
      console.log("Success:", data);

      alert("Login successful!");
      // we set an indicator for the current user
      localStorage.setItem("currentUserId", data.userId);
      localStorage.setItem("currentUserName", username);

      // Nutzer an "dashboard.html" weiterleiten
      navigate("/dashboard");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Login failed. Please try again.");
    });
}
