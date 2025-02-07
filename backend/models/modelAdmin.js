/**
 * @fileoverview Middleware zur Überprüfung von Administratorrechten.
 * Diese Datei stellt sicher, dass nur Benutzer mit Admin-Rechten auf bestimmte Routen zugreifen können.
 * 
 * @author Miray
 */

const User = require('../../database/User');
const UserRole = require('../../database/UserRole');

/**
 * Middleware zur Überprüfung von Administratorrechten.
 * 
 * @async
 * @function adminMiddleware
 * @param {Object} req - Das Request-Objekt, das die Benutzersitzung enthält.
 * @param {Object} res - Das Response-Objekt zum Senden von HTTP-Antworten.
 * @param {Function} next - Die nächste Middleware-Funktion im Stack.
 * @returns {void} Sendet eine HTTP-Antwort, wenn der Zugriff verweigert wird.
 * @throws {Error} Falls ein Serverfehler bei der Admin-Überprüfung auftritt.
 */
async function adminMiddleware(req, res, next) {
  const userId = req.session?.userId; // Benutzer-ID aus der Session holen

  if (!userId) {
    return res.status(401).json({ message: 'Nicht autorisiert. Bitte einloggen.' });
  }

  try {
    // Prüfe, ob der Benutzer die Admin-Rolle besitzt
    const userWithRole = await User.findOne({
      where: { user_id: userId },
      include: {
        model: UserRole,
        where: { role_name: 'admin' }, // Admin-Rolle überprüfen
        through: { attributes: [] },
      },
    });

    if (!userWithRole) {
      return res.status(403).json({ message: 'Zugriff verweigert: Nur für Administratoren.' });
    }

    next(); // Benutzer ist Admin, Weiterleitung zur nächsten Funktion
  } catch (error) {
    console.error('Fehler bei der Admin-Überprüfung:', error);
    res.status(500).json({ message: 'Serverfehler bei der Admin-Überprüfung.' });
  }
}

module.exports = adminMiddleware;
