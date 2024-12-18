/**
 * Diese Datei enthält Middleware-Funktionen zur Überprüfung von Administratorrechten.
 * Sie ermöglicht die Überprüfung, ob ein Benutzer die Admin-Rolle besitzt, bevor er auf bestimmte Routen zugreifen darf.
 *
 * @author Miray
 * 
 */

const User = require('../../database/User');
const UserRole = require('../../database/UserRole');

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
