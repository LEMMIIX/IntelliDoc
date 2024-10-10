const express = require('express');
const router = express.Router();
const semanticSearch = require('../models/modelSemanticSearch');

router.post('/', async (req, res) => {
    try {
        const { query } = req.body;
        const searchInstance = semanticSearch();
        const results = await searchInstance.executeSearch(query, { limit: 10 });
        res.json(results);
    } catch (error) {
        console.error('Error during semantic search:', error);
        res.status(500).json({ message: 'An error occurred during the search' });
    }
});

module.exports = router;