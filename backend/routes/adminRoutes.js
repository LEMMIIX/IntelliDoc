/**
 * @fileoverview Diese Datei enthält die Routen für die Admin-Funktionen.
 * Sie ermöglicht das Abrufen, Löschen und Bearbeiten von Benutzern sowie das Verwalten von Admin-Rollen.
 * 
 * @module adminRoutes
 * @author Miray
 */

const express = require('express');
const router = express.Router();
const adminMiddleware = require('../models/modelAdmin');
const User = require('../../database/User');
const UserRoleMapping = require('../../database/UserRoleMapping');
const bcrypt = require('bcrypt');

/**
 * Gibt eine Liste aller registrierten Benutzer zurück.
 * 
 * @async
 * @function
 * @route GET /users
 * @param {Object} req - Das Request-Objekt.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Eine JSON-Liste aller Benutzer.
 * @throws {Error} Falls ein Serverfehler auftritt.
 */
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['user_id', 'user_name', 'email', 'is_verified', 'registered_at'],
    });
    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Benutzer.' });
  }
});

/**
 * Löscht einen Benutzer basierend auf der angegebenen Benutzer-ID.
 * 
 * @async
 * @function
 * @route DELETE /users/:id
 * @param {Object} req - Das Request-Objekt mit der Benutzer-ID in `params`.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Eine Bestätigung über das Löschen des Benutzers.
 * @throws {Error} Falls der Benutzer nicht gefunden wird oder ein Serverfehler auftritt.
 */
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }

    await user.destroy();
    res.json({ message: 'Benutzer erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen des Benutzers.' });
  }
});

/**
 * Aktualisiert die Daten eines Benutzers basierend auf der Benutzer-ID.
 * 
 * @async
 * @function
 * @route PUT /users/:id
 * @param {Object} req - Das Request-Objekt mit `params.id` (Benutzer-ID) und `body` (Benutzerdaten).
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Eine Bestätigung über die Aktualisierung des Benutzers.
 * @throws {Error} Falls der Benutzer nicht gefunden wird oder ein Serverfehler auftritt.
 */
router.put('/users/:id', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  console.log("Received userId:", userId);

  const { user_name, email, password } = req.body;

  try {
    if (isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID.' });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }

    if (user_name) user.user_name = user_name;
    if (email) user.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({ message: 'Benutzer erfolgreich aktualisiert.' });
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Benutzers:', error);
    res.status(500).json({ message: 'Serverfehler beim Bearbeiten des Benutzers.' });
  }
});

/**
 * Weist einem Benutzer die Admin-Rolle zu.
 * 
 * @async
 * @function
 * @route POST /users/:id/assign-admin
 * @param {Object} req - Das Request-Objekt mit der Benutzer-ID in `params`.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Eine Bestätigung über die erfolgreiche Zuweisung der Admin-Rolle.
 * @throws {Error} Falls der Benutzer bereits Admin ist oder ein Serverfehler auftritt.
 */
router.post('/users/:id/assign-admin', adminMiddleware, async (req, res) => {
  const userId = req.params.id;

  try {
    const adminRoleId = 1;

    const existingMapping = await UserRoleMapping.findOne({
      where: { user_id: userId, role_id: adminRoleId },
    });

    if (existingMapping) {
      return res.status(400).json({ message: 'Benutzer hat bereits Admin-Rechte.' });
    }


    await UserRoleMapping.create({
      user_id: userId,
      role_id: adminRoleId,
    });

    res.json({ message: 'Admin-Rolle erfolgreich zugewiesen.' });
  } catch (error) {
    console.error('Fehler beim Zuweisen der Admin-Rolle:', error);
    res.status(500).json({ message: 'Serverfehler beim Zuweisen der Admin-Rolle.' });
  }
});

/**
 * Gibt eine Liste aller Benutzer zurück, die die Admin-Rolle besitzen.
 * 
 * @async
 * @function
 * @route GET /admin-roles
 * @param {Object} req - Das Request-Objekt.
 * @param {Object} res - Das Response-Objekt mit einer Liste von Admin-Benutzer-IDs.
 * @returns {Promise<void>} Eine JSON-Liste mit den IDs aller Admin-Benutzer.
 * @throws {Error} Falls ein Serverfehler auftritt.
 */
router.get('/admin-roles', adminMiddleware, async (req, res) => {
  try {
    const adminRoleId = 1;
    const adminMappings = await UserRoleMapping.findAll({
      where: { role_id: adminRoleId },
    });
    const adminUserIds = adminMappings.map((mapping) => mapping.user_id);
    res.json({ adminUserIds });
  } catch (error) {
    console.error("Fehler beim Abrufen der Admin-Benutzer:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Admin-Benutzer." });
  }
});


module.exports = router;
