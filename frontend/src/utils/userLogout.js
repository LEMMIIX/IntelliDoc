import prodconfig from "../production-config";

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
