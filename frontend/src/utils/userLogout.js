const backendUrl = "http://localhost:3000";

export async function userLogout(navigate) {
  try {
    const response = await fetch(backendUrl + "/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Can not logout now , try later!");
    }
    const data = await response.json();
    console.log(data);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserName");
    navigate("/login");
  } catch (err) {
    console.log(err);
  }
}
