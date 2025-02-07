/**
 * @file AdminDashboard.jsx - Administrator-Verwaltungsoberfläche
 * @author Miray
 * @description Diese Komponente stellt die Hauptverwaltungsoberfläche für Administratoren dar.
 * Sie ermöglicht die Verwaltung von Benutzern und das Monitoring von Datenbank-Aktivitäten.
 * 
 * @requires react
 * @requires sweetalert2
 * @requires ../../production-config
 */

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import prodconfig from "../../production-config";

/**
 * @component AdminDashboard
 * @description Hauptkomponente für die Administrator-Verwaltungsoberfläche
 * 
 * @example
 * return (
 *   <AdminDashboard />
 * )
 */
/**
 * @typedef {Object} User
 * @property {number} user_id - Eindeutige Benutzer-ID
 * @property {string} user_name - Benutzername
 * @property {string} email - E-Mail-Adresse des Benutzers
 * @property {boolean} is_verified - Verifizierungsstatus
 * @property {Date} registered_at - Registrierungsdatum
 */
/**
 * @typedef {Object} DBSession
 * @property {string} datname - Name der Datenbank
 * @property {string} usename - Datenbankbenutzer
 * @property {string} state - Aktueller Status
 * @property {string} query - Aktuelle Abfrage
 * @property {string} query_start - Startzeitpunkt der Abfrage
 */
/**
 * @typedef {Object} DBStats
 * @property {string} datname - Name der Datenbank
 * @property {number} active_connections - Anzahl aktiver Verbindungen
 * @property {number} committed_transactions - Anzahl erfolgreich abgeschlossener Transaktionen
 * @property {number} rolledback_transactions - Anzahl zurückgerollter Transaktionen
 * @property {number} blocks_read - Anzahl gelesener Blöcke
 * @property {number} blocks_hit - Cache-Treffer
 */
/**
 * State-Hooks der Komponente
 * @type {Object}
 * @property {User[]} users - Liste aller Benutzer
 * @property {User|null} editingUser - Aktuell bearbeiteter Benutzer
 * @property {string} newEmail - Neue E-Mail-Adresse bei Bearbeitung
 * @property {string} newPassword - Neues Passwort bei Bearbeitung
 * @property {DBSession[]} dbSessions - Aktive Datenbank-Sitzungen
 * @property {DBStats[]} dbStats - Datenbankstatistiken
 * @property {boolean} isMonitoringLoading - Ladezustand des Monitorings
 * @property {Set<number>} adminUserIds - Set der Admin-Benutzer-IDs
 */
const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [dbSessions, setDbSessions] = useState([]);
  const [dbStats, setDbStats] = useState([]);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState(false);
  const [adminUserIds, setAdminUserIds] = useState(new Set());

  useEffect(() => {
    fetchAdminUserIds();
  }, []);
  
/**
 * @function fetchAdminUserIds
 * @async
 * @description Ruft die IDs aller Admin-Benutzer vom Server ab
 * @throws {Error} Wenn die Anfrage fehlschlägt
 */
  const fetchAdminUserIds = async () => {
    try {
      const response = await fetch(
        `${prodconfig.backendUrl}/api/admin/admin-roles`,
        { credentials: "include" }
      );
      const data = await response.json();
      setAdminUserIds(new Set(data.adminUserIds)); 
    } catch (error) {
      console.error("Fehler beim Abrufen der Admin-Benutzer:", error);
    }
  };

  useEffect(() => {
    fetch(`${prodconfig.backendUrl}/api/admin/users`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Fehler beim Abrufen der Benutzer:", error));

    fetchDbSessions();
    fetchDbStats();
  }, []);

  /**
 * @function fetchDbSessions
 * @async
 * @description Ruft aktuelle Datenbank-Sitzungsinformationen ab
 * @throws {Error} Wenn die Abfrage fehlschlägt
 */
  const fetchDbSessions = async () => {
    setIsMonitoringLoading(true);
    try {
      const response = await fetch(`${prodconfig.backendUrl}/monitor/db-sessions`, { credentials: "include" });
      const data = await response.json();
      setDbSessions(data);
    } catch (error) {
      console.error("Fehler beim Abrufen der DB-Sitzungen:", error);
    } finally {
      setIsMonitoringLoading(false);
    }
  };

  /**
 * @function fetchDbStats
 * @async
 * @description Ruft Datenbankstatistiken ab
 * @throws {Error} Wenn die Abfrage fehlschlägt
 */
  const fetchDbStats = async () => {
    setIsMonitoringLoading(true);
    try {
      const response = await fetch(`${prodconfig.backendUrl}/monitor/db-stats`, { credentials: "include" });
      const data = await response.json();
      setDbStats(data);
    } catch (error) {
      console.error("Fehler beim Abrufen der DB-Statistiken:", error);
    } finally {
      setIsMonitoringLoading(false);
    }
  };

  /**
 * @function deleteUser
 * @async
 * @param {number} id - ID des zu löschenden Benutzers
 * @description Löscht einen Benutzer nach Bestätigung
 * @throws {Error} Wenn das Löschen fehlschlägt
 */
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
        await fetch(`${prodconfig.backendUrl}/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
        setUsers(users.filter((user) => user.user_id !== id));
        Swal.fire("Gelöscht!", "Der Benutzer wurde erfolgreich gelöscht.", "success");
      } catch (error) {
        Swal.fire("Fehler", "Benutzer konnte nicht gelöscht werden.", "error");
        console.error("Fehler beim Löschen des Benutzers:", error);
      }
    }
  };

  /**
 * @function assignAdmin
 * @async
 * @param {number} id - ID des Benutzers, der Admin-Rechte erhalten soll
 * @description Weist einem Benutzer Admin-Rechte zu
 * @throws {Error} Wenn die Rechtezuweisung fehlschlägt
 */
  const assignAdmin = async (id) => {
    const user = users.find(u => u.user_id === id);
  
    if (user?.roles?.some(role => role.role_name === 'admin')) {
      Swal.fire("Info", "Dieser Benutzer ist bereits Admin.", "info");
      return;
    }
  
    const confirmed = await Swal.fire({
      title: "Sind Sie sicher?",
      text: "Dieser Benutzer wird Admin-Rechte erhalten.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ja, befördern!",
      cancelButtonText: "Abbrechen",
    });
  
    if (!confirmed.isConfirmed) return;
  
    try {
      const response = await fetch(`${prodconfig.backendUrl}/api/admin/users/${id}/assign-admin`, {
        method: "POST",
        credentials: "include",
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fehler beim Zuweisen der Admin-Rechte.");
      }
  
      await Swal.fire("Erfolg", "Admin-Rechte erfolgreich zugewiesen.", "success");
  
      // Seite neu laden
      window.location.reload();
    } catch (error) {
      Swal.fire("Fehler", error.message, "error");
      console.error("Fehler beim Zuweisen der Admin-Rechte:", error);
    }
  };
  
/**
 * @function updateUser
 * @async
 * @description Aktualisiert die Benutzerdaten des ausgewählten Benutzers
 * @throws {Error} Wenn die Aktualisierung fehlschlägt
 */
  const updateUser = async () => {
    try {
      const response = await fetch(`${prodconfig.backendUrl}/api/admin/users/${editingUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Fehler beim Aktualisieren.");
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === editingUser.user_id ? { ...user, email: newEmail } : user
        )
      );

      Swal.fire("Erfolg", "Benutzer erfolgreich aktualisiert.", "success");
      setEditingUser(null);
      setNewEmail("");
      setNewPassword("");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Benutzers:", error);
    }
  };

  return (
    <div className="dashboard">
      <div className="shadow-sm bg-white border-y border-slate-200">
        <div className="flex items-center justify-between py-2 px-3">
          <h1 className="text-lg font-semibold text-black">Admin-Dashboard</h1>
          <button
            onClick={() => { window.location.href = "/dashboard"; }}
            className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>

      <div className="mt-16 px-4">
        <h2 className="text-xl font-semibold mb-4">Benutzerverwaltung</h2>
        <table className="w-full text-black border-collapse border border-slate-300">
          <thead>
            <tr>
              <th className="border border-slate-300 px-4 py-2">ID</th>
              <th className="border border-slate-300 px-4 py-2">Benutzername</th>
              <th className="border border-slate-300 px-4 py-2">E-Mail</th>
              <th className="border border-slate-300 px-4 py-2">Verifiziert</th>
              <th className="border border-slate-300 px-4 py-2">Registriert am</th>
              <th className="border border-slate-300 px-4 py-2">Admin</th>
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
                <td className="border border-slate-300 px-4 py-2">
                  {adminUserIds.has(user.user_id) ? "Ja" : "Nein"}
                </td>
                <td className="border border-slate-300 px-4 py-2 flex gap-2">
                  <button
                    className={`px-3 py-1 rounded ${adminUserIds.has(user.user_id)
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed border border-gray-300"
                        : "bg-[#669f62] hover:bg-[#68b461] text-white"
                      }`}
                    onClick={() => !adminUserIds.has(user.user_id) && assignAdmin(user.user_id)}
                    disabled={adminUserIds.has(user.user_id)}
                    title={
                      adminUserIds.has(user.user_id)
                        ? "Benutzer ist bereits Admin"
                        : "Zum Admin befördern"
                    }
                  >
                    {adminUserIds.has(user.user_id) ? "Bereits Admin" : "Admin-Rechte zuweisen"}
                  </button>

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
                      setNewPassword(""); 
                    }}
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      <div className="monitoring-section mt-8">
        <h2 className="text-xl font-semibold mb-4">System Monitoring</h2>

        {isMonitoringLoading ? (
          <p>Lade Monitoring-Daten...</p>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium">Aktive DB-Sitzungen</h3>
              <table className="w-full text-black border-collapse border border-slate-300">
                <thead>
                  <tr>
                    <th className="border border-slate-300 px-4 py-2">Datenbank</th>
                    <th className="border border-slate-300 px-4 py-2">Benutzer</th>
                    <th className="border border-slate-300 px-4 py-2">Status</th>
                    <th className="border border-slate-300 px-4 py-2">Abfrage</th>
                    <th className="border border-slate-300 px-4 py-2">Abfragebeginn</th>
                  </tr>
                </thead>
                <tbody>
                  {dbSessions.map((session, index) => (
                    <tr key={index}>
                      <td className="border border-slate-300 px-4 py-2">{session.datname}</td>
                      <td className="border border-slate-300 px-4 py-2">{session.usename}</td>
                      <td className="border border-slate-300 px-4 py-2">{session.state}</td>
                      <td className="border border-slate-300 px-4 py-2">{session.query}</td>
                      <td className="border border-slate-300 px-4 py-2">{session.query_start}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-medium">Datenbankstatistiken</h3>
              <table className="w-full text-black border-collapse border border-slate-300">
                <thead>
                  <tr>
                    <th className="border border-slate-300 px-4 py-2">Datenbank</th>
                    <th className="border border-slate-300 px-4 py-2">Aktive Verbindungen</th>
                    <th className="border border-slate-300 px-4 py-2">Transaktionen (Commit)</th>
                    <th className="border border-slate-300 px-4 py-2">Transaktionen (Rollback)</th>
                    <th className="border border-slate-300 px-4 py-2">Gelesene Blöcke</th>
                    <th className="border border-slate-300 px-4 py-2">Treffer in Blöcken</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStats.map((stat, index) => (
                    <tr key={index}>
                      <td className="border border-slate-300 px-4 py-2">{stat.datname}</td>
                      <td className="border border-slate-300 px-4 py-2">{stat.active_connections}</td>
                      <td className="border border-slate-300 px-4 py-2">{stat.committed_transactions}</td>
                      <td className="border border-slate-300 px-4 py-2">{stat.rolledback_transactions}</td>
                      <td className="border border-slate-300 px-4 py-2">{stat.blocks_read}</td>
                      <td className="border border-slate-300 px-4 py-2">{stat.blocks_hit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;