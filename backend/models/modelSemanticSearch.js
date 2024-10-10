const { generateEmbedding } = require('./modelEmbedding');
const db = require('../../ConnectPostgres');

function semanticSearch(options = {}) {
    const {
        cacheEnabled = false,
        relevanceFeedbackEnabled = false
    } = options;

    const cache = new Map(); // Simple in-memory cache

    async function executeSearch(query, options = {}) {
        const {
            limit = 10,
            filters = {},
            useCache = cacheEnabled
        } = options;

        // Check cache if enabled
        if (useCache) {
            const cachedResult = getFromCache(query);
            if (cachedResult) return cachedResult;
        }

        const queryEmbedding = await generateEmbedding(query);
        const results = await dbQuery(queryEmbedding, limit, filters);

        // Cache results if caching is enabled
        if (useCache) {
            addToCache(query, results);
        }

        return results;
    }

    async function dbQuery(queryEmbedding, limit, filters) {
        const filterConditions = buildFilterConditions(filters);
        
        // Convert the JavaScript array to a PostgreSQL vector string
        const vectorString = '[' + queryEmbedding.join(',') + ']';
        
        const query = `
            SELECT file_id, file_name, file_type, 
                   1 - (embedding <=> $1::vector) AS similarity
            FROM main.files
            ${filterConditions ? `WHERE ${filterConditions}` : ''}
            ORDER BY similarity DESC
            LIMIT $2
        `;
        
        const result = await db.query(query, [vectorString, limit]);
        return result.rows.map(row => ({
            id: row.file_id,
            name: row.file_name,
            type: row.file_type,
            distance: 1 - row.similarity
        }));
    }

    function buildFilterConditions(filters) {
        return Object.entries(filters)
            .map(([key, value]) => `${key} = '${value}'`)
            .join(' AND ');
    }

    function getFromCache(query) {
        return cache.get(query);
    }

    function addToCache(query, results) {
        cache.set(query, results);
    }

    async function provideFeedback(queryId, documentId, isRelevant) {
        if (relevanceFeedbackEnabled) {
            // Implement relevance feedback logic here
            console.log(`Feedback received for query ${queryId}, document ${documentId}: ${isRelevant}`);
        }
    }

    return {
        executeSearch,
        provideFeedback
    };
}

module.exports = semanticSearch;