/**
 * @fileoverview Diese Datei enthält die Route für die semantische Suche.
 * Sie ermöglicht die Durchführung von Suchanfragen und die Rückgabe von Suchergebnissen an das Frontend.
 * 
 * @module semanticSearchRoutes
 * @author Lennart, Miray
 */

const express = require('express');
const router = express.Router();
const semanticSearch = require('../models/modelSemanticSearch');

const searchInstance = semanticSearch();

/**
 * Führt eine semantische Suche basierend auf der Benutzeranfrage durch.
 * 
 * @async
 * @function
 * @route POST /
 * @param {Object} req - Das Request-Objekt mit der Suchanfrage.
 * @param {string} req.body.query - Die Suchanfrage des Benutzers.
 * @param {number} [req.body.limit=10] - Die maximale Anzahl zurückgegebener Suchergebnisse.
 * @param {Object} res - Das Response-Objekt mit den Suchergebnissen.
 * @returns {Promise<void>} Eine JSON-Liste mit den Suchergebnissen.
 * @throws {Error} Falls ein Fehler während der Suche auftritt oder der Benutzer nicht authentifiziert ist.
 */
router.post('/', async (req, res) => {
    try {
        const { query, limit = 10 } = req.body;

        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const results = await searchInstance.executeSearch(query, {
            limit: parseInt(limit),
            req: req
        });

        res.json(results);
    } catch (error) {
        console.error('Error during semantic search:', error);
        res.status(500).json({ message: 'An error occurred during the search' });
    }
});

module.exports = router;