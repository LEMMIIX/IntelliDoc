const { generateEmbedding } = require('./modelEmbedding');
const db = require('../../ConnectPostgres');

function semanticSearch(options = {}) {
    const {
        cacheEnabled = false,
        relevanceFeedbackEnabled = false,
        maxCacheSize = 1000,  // Maximum number of cached queries
        cacheExpiryMs = 1000 * 60 * 60 // 1 hour cache expiry
    } = options;

    const cache = new Map();
    const cacheTimestamps = new Map();

    function addToCache(key, results) {
        // Clear old entries if cache is too large
        if (cache.size >= maxCacheSize) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
            cacheTimestamps.delete(oldestKey);
        }

        cache.set(key, results);
        cacheTimestamps.set(key, Date.now());
    }

    function getFromCache(key) {
        const timestamp = cacheTimestamps.get(key);
        if (!timestamp) return null;

        // Check if cache entry has expired
        if (Date.now() - timestamp > cacheExpiryMs) {
            cache.delete(key);
            cacheTimestamps.delete(key);
            return null;
        }

        return cache.get(key);
    }

    function clearCache() {
        cache.clear();
        cacheTimestamps.clear();
        console.log('Search cache cleared');
    }

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
        const vectorString = '[' + queryEmbedding.join(',') + ']';
        const whereClause = `WHERE user_id = $3 ${filterConditions ? `AND ${filterConditions}` : ''}`;
        
        const expandedLimit = Math.min(limit * 3, 30);
        
        const query = `
            WITH similarity_scores AS (
                SELECT 
                    file_id, 
                    file_name, 
                    file_type,
                    -- Calculate cosine similarity (in range 0-1)
                    (1 - (embedding <=> $1::vector)) AS cosine_similarity,
                    -- Calculate euclidean distance and normalize to 0-1 range
                    1 - (embedding <-> $1::vector) / NULLIF(MAX(embedding <-> $1::vector) OVER (), 1) AS normalized_euclidean_similarity,
                    -- Inner product to measure relevance (normalized using sigmoid to 0-1 range)
                    1 / (1 + EXP(-(embedding <#> $1::vector))) AS sigmoid_inner_product
                FROM main.files
                ${whereClause}
            )
            SELECT 
                file_id,
                file_name,
                file_type,
                cosine_similarity,
                normalized_euclidean_similarity,
                sigmoid_inner_product,
                -- Combined similarity score with optimized weights for semantic search
                (
                    (0.7 * cosine_similarity + 
                    0.2 * normalized_euclidean_similarity +
                    0.1 * sigmoid_inner_product) * 100
                ) AS final_similarity
            FROM similarity_scores
            ORDER BY final_similarity DESC
            LIMIT $2
        `;
        
        const queryParams = [vectorString, expandedLimit, userId];
        
        const result = await db.query(query, queryParams);
        return result.rows.map(row => ({
            id: row.file_id,
            name: row.file_name,
            type: row.file_type,
            distance: row.final_similarity,
            metrics: {
                cosine: row.cosine_similarity,
                euclidean: row.normalized_euclidean_similarity,
                innerProduct: row.sigmoid_inner_product
            }
        }));
    }
    
    function buildFilterConditions(filters) {
        return Object.entries(filters)
            .map(([key, value]) => `${key} = '${value}'`)
            .join(' AND ');
    }

    async function provideFeedback(queryId, documentId, isRelevant) {
        if (relevanceFeedbackEnabled) {
            // Implement relevance feedback logic here
            //console.log(`Feedback received for query ${queryId}, document ${documentId}: ${isRelevant}`);
        }
    }

    return {
        executeSearch,
        provideFeedback,
        clearCache
    };
}

module.exports = semanticSearch;