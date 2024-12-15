import { customFetch } from "./helpers";

const backendUrl = "http://localhost:3000";

export function getCurrentUser() {
  return customFetch(backendUrl + "/api/current-user")
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
