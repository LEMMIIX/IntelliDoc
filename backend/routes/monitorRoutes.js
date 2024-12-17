/**
 * Diese Datei enthölt die Routen für das Monitoring.
 * Sie ermöglicht das Abrufen von aktiven Datenbank-Sitzungen und Datenbankstatistiken.
 * Diese Daten werden in Admin page angezeigt in frontend. 
 *
 * @autor Miray
 */

const express = require('express');
const router = express.Router();
const db = require('../../ConnectPostgres');
const adminMiddleware = require('../models/modelAdmin');

// Monitoring-Endpunkt: Aktive Datenbank-Sitzungen abrufen
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

// Monitoring-Endpunkt: Datenbankstatistiken abrufen
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