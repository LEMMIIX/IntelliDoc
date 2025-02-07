/**
 * @fileoverview Diese Datei enthält die Routen für das Monitoring.
 * Sie ermöglicht das Abrufen von aktiven Datenbank-Sitzungen und Datenbankstatistiken.
 * Diese Daten werden in der Admin-Seite im Frontend angezeigt.
 * 
 * @module monitorRoutes
 * @author Miray
 */

const express = require('express');
const router = express.Router();
const db = require('../../ConnectPostgres');
const adminMiddleware = require('../models/modelAdmin');

/**
 * Ruft eine Liste der aktuell aktiven Datenbank-Sitzungen ab.
 * 
 * @async
 * @function
 * @route GET /db-sessions
 * @middleware adminMiddleware - Stellt sicher, dass nur Admins Zugriff haben.
 * @param {Object} req - Das Request-Objekt mit Admin-Sitzung.
 * @param {Object} res - Das Response-Objekt mit den aktiven Sitzungen.
 * @returns {Promise<void>} Eine JSON-Liste der aktiven Datenbank-Sitzungen.
 * @throws {Error} Falls das Abrufen der Sitzungen fehlschlägt.
 */
router.get('/db-sessions', adminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT datname, usename, state, query, query_start
      FROM pg_stat_activity
      WHERE state != 'idle'
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der DB-Sitzungen:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der DB-Sitzungen.' });
  }
});

/**
 * Ruft aktuelle Statistiken über die Datenbanknutzung ab.
 * 
 * @async
 * @function
 * @route GET /db-stats
 * @middleware adminMiddleware - Stellt sicher, dass nur Admins Zugriff haben.
 * @param {Object} req - Das Request-Objekt mit Admin-Sitzung.
 * @param {Object} res - Das Response-Objekt mit den Datenbankstatistiken.
 * @returns {Promise<void>} Eine JSON-Liste mit Datenbankstatistiken wie aktive Verbindungen, Transaktionen und Cache-Treffer.
 * @throws {Error} Falls das Abrufen der Statistiken fehlschlägt.
 */
router.get('/db-stats', adminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        datname,
        numbackends AS active_connections,
        xact_commit AS committed_transactions,
        xact_rollback AS rolledback_transactions,
        blks_read AS blocks_read,
        blks_hit AS blocks_hit
      FROM pg_stat_database
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Fehler beim Abrufen der DB-Statistiken:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der DB-Statistiken.' });
  }
});

module.exports = router;