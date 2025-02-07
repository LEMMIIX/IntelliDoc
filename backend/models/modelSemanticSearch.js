/**
 * @fileoverview Diese Datei enthält Funktionen zur Durchführung von semantischer Suche.
 * Sie ermöglicht das Generieren von Embeddings, das Durchführen von Datenbankabfragen 
 * und das Anwenden von Clustering-Boosts zur Verbesserung der Suchergebnisse.
 * 
 * @author Lennart, Miray
 * Die Funktionen wurden mit Unterstützung von KI-Tools angepasst und optimiert.
 * @module modelSemanticSearch
 */

const { generateEmbedding } = require('./modelEmbedding');
const { runClustering } = require('./modelClustering');
const db = require('../../ConnectPostgres');

/**
 * Erstellt eine Instanz für semantische Suche mit optionaler Caching- und Clustering-Optimierung.
 * 
 * @function semanticSearch
 * @param {Object} [options={}] - Konfigurationsoptionen für die Suche.
 * @param {boolean} [options.cacheEnabled=false] - Aktiviert das Caching für schnellere Suchanfragen.
 * @param {number} [options.maxCacheSize=1000] - Maximale Anzahl an Cache-Einträgen.
 * @param {number} [options.cacheExpiryMs=3600000] - Ablaufzeit des Caches in Millisekunden.
 * @param {boolean} [options.clusterBoostEnabled=true] - Aktiviert die Cluster-Optimierung für genauere Ergebnisse.
 * @returns {Object} Ein Objekt mit der Methode `executeSearch`.
 */
function semanticSearch(options = {}) {
    const {
        cacheEnabled = false,
        maxCacheSize = 1000,
        cacheExpiryMs = 1000 * 60 * 60,
        clusterBoostEnabled = true
    } = options;

    const cache = new Map();
    const cacheTimestamps = new Map();

    /**
 * Führt eine semantische Suche für eine gegebene Abfrage aus.
 * 
 * @async
 * @function executeSearch
 * @memberof semanticSearch
 * @param {string} query - Die Suchanfrage.
 * @param {Object} [options={}] - Zusätzliche Suchoptionen.
 * @param {number} [options.limit=10] - Maximale Anzahl zurückgegebener Ergebnisse.
 * @param {Object} [options.filters={}] - Filterbedingungen für die Abfrage.
 * @param {boolean} [options.useCache=true] - Verwendet den Cache, falls aktiviert.
 * @param {Object} options.req - Das Request-Objekt, um den Benutzer zu identifizieren.
 * @returns {Promise<Array<Object>>} Eine Liste relevanter Dokumente mit Ähnlichkeitswerten.
 * @throws {Error} Falls der Benutzer nicht authentifiziert ist oder ein Fehler bei der Suche auftritt.
 * @example
 * const results = await searchInstance.executeSearch("Deep Learning", { limit: 5, req });
 * console.log(results);
 */
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

    /**
 * Optimiert die Suchergebnisse durch Clustering-Analyse, um relevantere Dokumente hervorzuheben.
 * 
 * @async
 * @function applyClusterBoost
 * @memberof semanticSearch
 * @param {Array<Object>} results - Die ursprünglichen Suchergebnisse.
 * @param {Array<number>} queryEmbedding - Das Embedding der Suchanfrage.
 * @param {number} userId - Die Benutzer-ID.
 * @returns {Promise<Array<Object>>} Die optimierten Suchergebnisse mit Cluster-Boosting.
 */
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

    /**
 * Führt eine SQL-Abfrage für die semantische Suche in der Datenbank durch.
 * 
 * @async
 * @function dbQuery
 * @memberof semanticSearch
 * @param {Array<number>} queryEmbedding - Das Embedding der Suchanfrage.
 * @param {number} limit - Maximale Anzahl zurückgegebener Ergebnisse.
 * @param {Object} filters - Filteroptionen für die Datenbankabfrage.
 * @param {number} userId - Die Benutzer-ID für die Abfrage.
 * @returns {Promise<Array<Object>>} Eine Liste der Suchergebnisse mit Ähnlichkeitswerten.
 */
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

    /**
 * Fügt ein Ergebnis zur Cache-Speicherung hinzu, wobei der älteste Eintrag entfernt wird, wenn das Limit erreicht ist.
 * 
 * @function addToCache
 * @memberof semanticSearch
 * @param {string} key - Der Schlüssel für das Cache-Element.
 * @param {Array<Object>} results - Die Suchergebnisse, die gespeichert werden sollen.
 */
    function addToCache(key, results) {
        if (cache.size >= maxCacheSize) {
            const oldestKey = cache.keys().next().value;
            cache.delete(oldestKey);
            cacheTimestamps.delete(oldestKey);
        }
        cache.set(key, results);
        cacheTimestamps.set(key, Date.now());
    }

    /**
 * Ruft Ergebnisse aus dem Cache ab, falls sie noch gültig sind.
 * 
 * @function getFromCache
 * @memberof semanticSearch
 * @param {string} key - Der Schlüssel für das Cache-Element.
 * @returns {Array<Object>|null} Die gespeicherten Ergebnisse oder `null`, falls sie abgelaufen sind.
 */
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

    /**
 * Erstellt eine SQL-Filterbedingung basierend auf übergebenen Filtern.
 * 
 * @function buildFilterConditions
 * @memberof semanticSearch
 * @param {Object} filters - Das Objekt mit den Filterbedingungen.
 * @returns {string} Eine SQL-Filterklausel zur Verwendung in der Datenbankabfrage.
 */
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