import React, { useEffect, useState, useMemo } from "react";
import { FaThList } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import backendUrl from "../../production-config";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null); // User zum Bearbeiten
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // Fehlernachricht
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/admin/users`, {
        credentials: "include",
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Fehler beim Abrufen der Benutzer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id) => {
    const confirmed = await Swal.fire({
      title: "Benutzer löschen?",
      text: "Dieser Vorgang kann nicht rückgängig gemacht werden!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ja, löschen!",
      cancelButtonText: "Abbrechen",
    });

    if (confirmed.isConfirmed) {
      try {
        await fetch(`${backendUrl}/api/admin/users/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        setUsers(users.filter((user) => user.user_id !== id));
        Swal.fire("Gelöscht!", "Der Benutzer wurde erfolgreich gelöscht.", "success");
      } catch (error) {
        Swal.fire("Fehler", "Benutzer konnte nicht gelöscht werden.", "error");
        console.error("Fehler beim Löschen des Benutzers:", error);
      }
    }
  };

  const updateUser = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/users/${editingUser.user_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: newEmail, password: newPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fehler beim Aktualisieren.");
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === editingUser.user_id
            ? { ...user, email: newEmail }
            : user
        )
      );

      Swal.fire("Erfolg", "Benutzer erfolgreich aktualisiert.", "success");
      setEditingUser(null);
      setNewEmail("");
      setNewPassword("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      console.error("Fehler beim Aktualisieren des Benutzers:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/api/logout`, { method: "POST", credentials: "include" });
      navigate("/login"); // Zurück zur Login-Seite
    } catch (error) {
      console.error("Fehler beim Ausloggen:", error);
    }
  };

  return (
    <div className="dashboard">
      <div className="shadow-sm bg-white border-y border-slate-200 absolute left-0 top-0 right-0">
        <div className="flex items-center justify-between py-2 px-3">
          <h1 className="text-lg font-semibold text-black">Admin-Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>

      <div className="mt-16 px-4">
        {isLoading ? (
          <p>Lade Benutzer...</p>
        ) : (
          <table className="w-full text-black border-collapse border border-slate-300">
            <thead>
              <tr>
                <th className="border border-slate-300 px-4 py-2">ID</th>
                <th className="border border-slate-300 px-4 py-2">Benutzername</th>
                <th className="border border-slate-300 px-4 py-2">E-Mail</th>
                <th className="border border-slate-300 px-4 py-2">Verifiziert</th>
                <th className="border border-slate-300 px-4 py-2">Registriert am</th>
                <th className="border border-slate-300 px-4 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="border border-slate-300 px-4 py-2">{user.user_id}</td>
                  <td className="border border-slate-300 px-4 py-2">{user.user_name}</td>
                  <td className="border border-slate-300 px-4 py-2">{user.email}</td>
                  <td className="border border-slate-300 px-4 py-2">
                    {user.is_verified ? "Ja" : "Nein"}
                  </td>
                  <td className="border border-slate-300 px-4 py-2">
                    {user.registered_at
                      ? new Date(user.registered_at).toLocaleDateString("de-DE")
                      : "Kein Datum"}
                  </td>
                  <td className="border border-slate-300 px-4 py-2 flex gap-2">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => deleteUser(user.user_id)}
                    >
                      Löschen
                    </button>
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      onClick={() => {
                        setEditingUser(user);
                        setNewEmail(user.email);
                      }}
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bearbeiten-Popup */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Benutzer bearbeiten</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser();
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Benutzername:
                </label>
                <input
                  type="text"
                  value={editingUser.user_name}
                  disabled
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  E-Mail:
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Neues Passwort:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                />
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm mb-4">{errorMessage}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setNewEmail("");
                    setNewPassword("");
                    setErrorMessage("");
                  }}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
