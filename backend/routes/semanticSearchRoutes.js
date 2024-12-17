/**
 * Diese Datei enth�lt die Route f�r die semantische Suche.
 * Sie erm�glicht die Durchf�hrung von Suchanfragen und die R�ckgabe von Suchergebnissen an frontend. 
 *
 * @autor Miray
 */

const express = require('express');
const router = express.Router();
const semanticSearch = require('../models/modelSemanticSearch');

const searchInstance = semanticSearch();

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