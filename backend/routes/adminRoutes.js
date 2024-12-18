/**
 * Diese Datei enthält die Routen für die Admin-Funktionen.
 * Sie ermöglicht das Abrufen, Löschen und Bearbeiten von Benutzern.
 *
 * @autor Miray
 */
const express = require('express');
const router = express.Router();
const adminMiddleware = require('../models/modelAdmin');
const User = require('../../database/User');
const UserRoleMapping = require('../../database/UserRoleMapping'); 
const bcrypt = require('bcrypt');

// Admin-Endpunkt: Liste aller Benutzer abrufen
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

// Admin-Endpunkt: Benutzer löschen
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

// Admin-Endpunkt: Benutzer bearbeiten
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

// Admin-Endpunkt: Abrufen aller Admin-Benutzer-IDs
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
