import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Benutzer abrufen
    fetch("http://localhost:3000/api/admin/users", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Fehler beim Abrufen der Benutzer:", error));
  }, []);

  const deleteUser = (id) => {
    fetch(`http://localhost:3000/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(() => {
        setUsers(users.filter((user) => user.user_id !== id));
        alert("Benutzer erfolgreich gelöscht");
      })
      .catch((error) => console.error("Fehler beim Löschen des Benutzers:", error));
  };

  return (
    <div>
      <h1>Admin-Dashboard</h1>
      <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Benutzername</th>
        <th>E-Mail</th>
        <th>Verifiziert</th>
        <th>Registriert am</th>
        <th>Aktionen</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user.user_id}>
          <td>{user.user_id}</td>
          <td>{user.user_name}</td>
          <td>{user.email}</td>
          <td>{user.is_verified ? "Ja" : "Nein"}</td>
          <td>
            {/* Datum formatieren */}
            {user.registered_at
              ? new Date(user.registered_at).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })
              : "Kein Datum"}
          </td>
          <td>
          <button onClick={() => deleteUser(user.user_id)}>Löschen</button>
            <button onClick={() => alert("Benutzer bearbeiten")}>Bearbeiten</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
    </div>
  );
};

export default AdminDashboard;
