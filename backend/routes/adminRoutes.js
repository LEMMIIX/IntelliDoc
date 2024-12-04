const express = require('express');
const router = express.Router();
const adminMiddleware = require('../models/modelAdmin');
const User = require('../../database/User');
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
  const userId = req.params.id; // Diese Zeile extrahiert die ID aus den URL-Parametern
  console.log("Received userId:", userId);

  const { user_name, email, password } = req.body;

  try {
    // Überprüfe, ob userId ein Integer ist
    if (isNaN(parseInt(userId))) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID.' });
    }

    // Benutzer anhand der ID suchen
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden.' });
    }

    // Felder aktualisieren
    if (user_name) user.user_name = user_name;
    if (email) user.email = email;

    // Passwort aktualisieren, falls angegeben
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    // Änderungen speichern
    await user.save();

    res.json({ message: 'Benutzer erfolgreich aktualisiert.' });
  } catch (error) {
    console.error('Fehler beim Bearbeiten des Benutzers:', error);
    res.status(500).json({ message: 'Serverfehler beim Bearbeiten des Benutzers.' });
  }
});


module.exports = router;
