/**
 * @fileoverview Diese Datei enthält die Routen für die Authentifizierung.
 * Sie ermöglicht die Registrierung, Anmeldung und Abmeldung von Benutzern.
 * 
 * @module authRoutes
 * @author Ayoub
 */

const express = require('express');
const router = express.Router();
const { registerUser } = require('../models/userRegistrationToDB');
const { authenticateUser } = require('../models/userAuthenticationToDB');
const User = require('../../database/User');
const UserRole = require('../../database/UserRole');
const UserRoleMapping = require('../../database/UserRoleMapping');

/**
 * Registriert einen neuen Benutzer in der Datenbank.
 * 
 * @async
 * @function
 * @route POST /register
 * @param {Object} req - Das Request-Objekt mit Benutzername, E-Mail und Passwort.
 * @param {string} req.body.username - Der Benutzername des neuen Nutzers.
 * @param {string} req.body.email - Die E-Mail-Adresse des neuen Nutzers.
 * @param {string} req.body.password - Das Passwort des neuen Nutzers.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit der Benutzer-ID oder einer Fehlermeldung.
 * @throws {Error} Falls der Benutzer bereits existiert oder ein Serverfehler auftritt.
 */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userId = await registerUser(username, email, password);
    res.status(201).json({
      message: "User registered successfully. Please log in.",
      userId,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.message === "Username or email already exists") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Failed to insert user: No ID returned") {
      res.status(500).json({
        message: "User was created but an error occurred. Please contact support.",
      });
    } else {
      res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  }
});

/**
 * Meldet einen Benutzer an und speichert die Sitzung.
 * 
 * @async
 * @function
 * @route POST /login
 * @param {Object} req - Das Request-Objekt mit Anmeldeinformationen.
 * @param {string} req.body.username - Der Benutzername des Nutzers.
 * @param {string} req.body.password - Das Passwort des Nutzers.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit der Benutzer-ID und Admin-Status.
 * @throws {Error} Falls die Anmeldeinformationen ungültig sind oder ein Serverfehler auftritt.
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(username, password);
    if (user) {
      req.session.userId = user.id;

      const isAdmin = await UserRoleMapping.findOne({
        where: { user_id: user.id },
        include: [
          {
            model: UserRole,
            where: { role_name: "admin" },
          },
        ],
      });

      req.session.isAdmin = isAdmin?.UserRole?.role_name === 'admin';

      res.status(200).json({
        message: "Login successful",
        userId: user.id,
        isAdmin: !!isAdmin,
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

/**
 * Meldet einen Benutzer ab, indem die Sitzung zerstört wird.
 * 
 * @function
 * @route POST /logout
 * @param {Object} req - Das Request-Objekt mit der aktiven Benutzersitzung.
 * @param {Object} res - Das Response-Objekt.
 * @returns {void} Antwort mit einer Bestätigung der Abmeldung.
 * @throws {Error} Falls ein Fehler beim Beenden der Sitzung auftritt.
 */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ message: "Error logging out" });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
});

module.exports = router;