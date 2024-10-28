const { generateEmbedding } = require('./modelEmbedding');
const { runClustering } = require('./modelClustering');
const db = require('../../ConnectPostgres');

function semanticSearch(options = {}) {
    const {
        cacheEnabled = false,
        maxCacheSize = 1000,
        cacheExpiryMs = 1000 * 60 * 60,
        clusterBoostEnabled = true  // Toggle for cluster boosting
    } = options;

    const cache = new Map();
    const cacheTimestamps = new Map();
    let clusterCache = null;
    let clusterCacheTimestamp = null;
    const clusterCacheExpiry = 1000 * 60 * 15; // 15 minutes cluster cache

    async function executeSearch(query, options = {}) {
        console.log('Starting search execution for query:', query);
        
        const {
            limit = 10,
            filters = {},
            useCache = cacheEnabled,
            req
        } = options;

        if (!req?.session?.userId) {
            throw new Error("User is not authenticated");
        }

        const userId = req.session.userId;

        if (useCache) {
            const cachedResult = getFromCache(`${userId}:${query}`);
            if (cachedResult) {
                console.log('Returning cached results');
                return cachedResult;
            }
        }

        try {
            console.log('Generating embedding for query...');
            const queryEmbedding = await generateEmbedding(query);
            console.log('Embedding generated successfully');

            console.log('Executing database query...');
            let results = await dbQuery(queryEmbedding, limit, filters, userId);
            console.log(`Found ${results.length} results`);

            // Apply cluster boosting if enabled
            if (clusterBoostEnabled && results.length > 0) {
                console.log('Applying cluster boosting...');
                results = await applyClusterBoost(results, queryEmbedding);
            }

            if (useCache) {
                addToCache(`${userId}:${query}`, results);
            }

            return results;

        } catch (error) {
            console.error('Error in executeSearch:', error);
            throw error;
        }
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
                    embedding,
                    (1 - (embedding <=> $1::vector)) AS cosine_similarity,
                    1 - (embedding <-> $1::vector) / NULLIF(MAX(embedding <-> $1::vector) OVER (), 1) AS normalized_euclidean_similarity,
                    1 / (1 + EXP(-(embedding <#> $1::vector))) AS sigmoid_inner_product
                FROM main.files
                ${whereClause}
            )
            SELECT 
                file_id,
                file_name,
                file_type,
                embedding,
                (
                    (0.6 * cosine_similarity + 
                    0.25 * normalized_euclidean_similarity +
                    0.15 * sigmoid_inner_product) * 100
                ) AS similarity_score
            FROM similarity_scores
            ORDER BY similarity_score DESC
            LIMIT $2
        `;

        try {
            const result = await db.query(query, [vectorString, expandedLimit, userId]);
            
            return result.rows.map(row => ({
                id: row.file_id,
                name: row.file_name,
                type: row.file_type,
                embedding: row.embedding,
                distance: row.similarity_score
            }));

        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async function applyClusterBoost(results, queryEmbedding) {
        try {
            // Get embeddings for clustering
            const embeddings = [queryEmbedding, ...results.map(r => r.embedding)];
            
            // Run clustering
            console.log('Running clustering on results...');
            const clusterLabels = await runClustering(embeddings);
            console.log('Clustering completed');

            const queryCluster = clusterLabels[0];

            // Apply cluster boost
            results = results.map((result, index) => {
                const documentCluster = clusterLabels[index + 1];
                let boostAmount = 0;

                // Apply boost if document is in same cluster as query
                if (documentCluster === queryCluster && documentCluster !== -1) {
                    boostAmount = 10; // 10% boost for same cluster
                }

                // Clean up embedding before returning
                delete result.embedding;

                return {
                    ...result,
                    distance: Math.min(100, result.distance + boostAmount)
                };
            });

            // Re-sort results by boosted distance
            results.sort((a, b) => b.distance - a.distance);

            return results;

        } catch (error) {
            console.error('Error in cluster boosting:', error);
            // If clustering fails, return original results
            results.forEach(r => delete r.embedding);
            return results;
        }
    }

    // Cache management functions remain the same
    function addToCache(key, results) {
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
        if (Date.now() - timestamp > cacheExpiryMs) {
            cache.delete(key);
            cacheTimestamps.delete(key);
            return null;
        }
        return cache.get(key);
    }

    function buildFilterConditions(filters) {
        return Object.entries(filters)
            .map(([key, value]) => `${key} = '${value}'`)
            .join(' AND ');
    }

    return {
        executeSearch
    };
}

module.exports = semanticSearch;