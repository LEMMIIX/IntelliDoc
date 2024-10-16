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
            useCache = cacheEnabled,
            req // Pass the request object instead of userId
        } = options;

        if (!req || !req.session || !req.session.userId) {
            throw new Error("User is not authenticated");
        }

        const userId = req.session.userId;

        // Check cache if enabled
        if (useCache) {
            const cachedResult = getFromCache(`${userId}:${query}`);
            if (cachedResult) return cachedResult;
        }

        const queryEmbedding = await generateEmbedding(query);
        const results = await dbQuery(queryEmbedding, limit, filters, userId);

        // Cache results if caching is enabled
        if (useCache) {
            addToCache(`${userId}:${query}`, results);
        }

        return results;
    }

    async function dbQuery(queryEmbedding, limit, filters, userId) {
        const filterConditions = buildFilterConditions(filters);
        
        // Convert the JavaScript array to a PostgreSQL vector string
        const vectorString = '[' + queryEmbedding.join(',') + ']';
        
        // Always include user_id in the WHERE clause
        const whereClause = `WHERE user_id = $3 ${filterConditions ? `AND ${filterConditions}` : ''}`;
        
        const query = `
            SELECT file_id, file_name, file_type, 
                   1 - (embedding <=> $1::vector) AS similarity
            FROM main.files
            ${whereClause}
            ORDER BY similarity DESC
            LIMIT $2
        `;
        
        const queryParams = [vectorString, limit, userId];
        
        const result = await db.query(query, queryParams);
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

    function getFromCache(key) {
        return cache.get(key);
    }

    function addToCache(key, results) {
        cache.set(key, results);
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