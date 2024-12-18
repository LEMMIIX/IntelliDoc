/**
 * Diese Datei enthält Funktionen zur Durchführung von semantic Search.
 * Sie ermöglicht das Generieren von Embeddings, das Durchführen von Datenbankabfragen und das Anwenden von Clustering-Boosts.
 *
 * @autor Lennart, Miray
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

const { generateEmbedding } = require('./modelEmbedding');
const { runClustering } = require('./modelClustering');
const db = require('../../ConnectPostgres');

function semanticSearch(options = {}) {
    const {
        cacheEnabled = false,
        maxCacheSize = 1000,
        cacheExpiryMs = 1000 * 60 * 60,
        clusterBoostEnabled = true
    } = options;

    const cache = new Map();
    const cacheTimestamps = new Map();

    async function executeSearch(query, options = {}) {
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
            if (cachedResult) return cachedResult;
        }

        try {
            const queryEmbedding = await generateEmbedding(query);
            let results = await dbQuery(queryEmbedding, limit, filters, userId);

            if (clusterBoostEnabled && results.length > 0) {
                console.log('Starting clustering enhancement...');
                results = await applyClusterBoost(results, queryEmbedding, userId);
                console.log('Clustering enhancement completed successfully');
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

    async function applyClusterBoost(results, queryEmbedding, userId) {
        try {
            const embeddings = [queryEmbedding, ...results.map(r => r.embedding)];
            const config = {
                minClusterSize: 2,
                minSamples: 2,
                clusterSelectionMethod: 'eom',
                clusterSelectionEpsilon: 0.15
            };
            
            const clusterResults = await runClustering(embeddings, config, userId);
            const clusterLabels = clusterResults.labels;
            const queryCluster = clusterLabels[0];

            results = results.map((result, index) => {
                const documentCluster = clusterLabels[index + 1];
                let boostAmount = 0;

                if (documentCluster === queryCluster && documentCluster !== -1) {
                    boostAmount = 10;
                }

                delete result.embedding;

                return {
                    ...result,
                    distance: Math.min(100, result.distance + boostAmount)
                };
            });

            return results.sort((a, b) => b.distance - a.distance);

        } catch (error) {
            console.error('Error in cluster boosting:', error);
            results.forEach(r => delete r.embedding);
            return results;
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