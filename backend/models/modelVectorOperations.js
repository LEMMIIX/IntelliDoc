/**
 * @fileoverview Diese Datei enthält die Definition der Klasse VectorOperations.
 * Sie ermöglicht die Berechnung von Ähnlichkeiten zwischen Vektoren und die Verwaltung eines Caches für diese Berechnungen.
 * 
 * @author Lennart, Miray
 * Die Funktionen wurden mit Unterstützung von KI vorgeneriert und angepasst.
 * @module modelVectorOperations
 */

const { performance } = require('perf_hooks');

/**
 * Klasse zur Berechnung von Ähnlichkeiten zwischen Vektoren und Verwaltung eines Cache-Mechanismus.
 * 
 * @class VectorOperations
 * @property {boolean} useCache - Gibt an, ob der Cache für Berechnungen verwendet wird.
 * @property {number} exactMatchWeight - Gewichtung der euklidischen Distanz in der Ähnlichkeitsberechnung.
 * @property {number} semanticWeight - Gewichtung der Kosinusähnlichkeit in der Berechnung.
 * @property {Map} similarityCache - Cache zur Speicherung von Ähnlichkeitsberechnungen.
 * @property {number} cacheMaxSize - Maximale Anzahl an Cache-Einträgen.
 * @property {number} cacheCleanupInterval - Intervall für die Cache-Bereinigung in Millisekunden.
 */
class VectorOperations {

    /**
 * Erstellt eine Instanz von VectorOperations mit den angegebenen Optionen.
 * 
 * @constructor
 * @param {Object} [options={}] - Konfigurationsoptionen für die Vektorrechnungen.
 * @param {boolean} [options.useCache=true] - Gibt an, ob ein Cache verwendet werden soll.
 * @param {number} [options.exactMatchWeight=0.9] - Gewichtung für euklidische Distanz.
 * @param {number} [options.semanticWeight=0.2] - Gewichtung für Kosinusähnlichkeit.
 * @param {number} [options.cacheMaxSize=1000] - Maximale Anzahl an Cache-Einträgen.
 * @param {number} [options.cacheCleanupInterval=300000] - Intervall für die Cache-Bereinigung in Millisekunden.
 */
    constructor(options = {}) {
        this.useCache = options.useCache ?? true;
        this.exactMatchWeight = options.exactMatchWeight || 0.9;
        this.semanticWeight = options.semanticWeight || 0.2;
        this.similarityCache = new Map();
        this.lastCacheClean = Date.now();
        this.cacheMaxSize = options.cacheMaxSize || 1000;
        this.cacheCleanupInterval = options.cacheCleanupInterval || 1000 * 60 * 5; // 5 minutes
    }

    /**
 * Berechnet die Ähnlichkeit zwischen zwei Vektoren unter Verwendung von Kosinus- und euklidischer Distanz.
 * 
 * @method calculateSimilarity
 * @memberof VectorOperations
 * @param {number[]} embedding1 - Der erste Vektor.
 * @param {number[]} embedding2 - Der zweite Vektor.
 * @returns {number} Ein Ähnlichkeitswert zwischen 0 und 1.
 * @example
 * const similarity = vectorOps.calculateSimilarity([0.1, 0.2], [0.1, 0.25]);
 * console.log(similarity);
 */
    calculateSimilarity(embedding1, embedding2) {
        // Parse and clean embeddings if needed
        const vec1 = this._prepareVector(embedding1);
        const vec2 = this._prepareVector(embedding2);

        // Calculate both similarity metrics
        const cosineSim = this._calculateCosineSimilarity(vec1, vec2);
        const euclideanSim = this._calculateEuclideanSimilarity(vec1, vec2);

        // Weighted combination of both metrics
        return (this.exactMatchWeight * euclideanSim) + (this.semanticWeight * cosineSim);
    }

    /**
 * Konvertiert einen Vektor in ein geeignetes Zahlenformat und filtert ungültige Werte.
 * 
 * @method _prepareVector
 * @memberof VectorOperations
 * @param {string|Array<number>} embedding - Der zu verarbeitende Vektor.
 * @returns {number[]} Ein Array mit validierten Zahlenwerten.
 */
    _prepareVector(embedding) {
        if (!embedding) return null;

        if (typeof embedding === 'string') {
            // Handle PostgreSQL array format and other string formats
            return embedding
                .replace(/[{\[\]}]/g, '') // Remove brackets and braces
                .split(',')
                .map(num => parseFloat(num.trim()))
                .filter(num => !isNaN(num)); // Filter out any invalid numbers
        }

        if (Array.isArray(embedding)) {
            return embedding.map(num => parseFloat(num)).filter(num => !isNaN(num));
        }

        return null;
    }

    /**
 * Berechnet die Kosinusähnlichkeit zwischen zwei Vektoren.
 * 
 * @method _calculateCosineSimilarity
 * @memberof VectorOperations
 * @param {number[]} vec1 - Der erste Vektor.
 * @param {number[]} vec2 - Der zweite Vektor.
 * @returns {number} Die Kosinusähnlichkeit zwischen -1 und 1.
 */
    _calculateCosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        const len = vec1.length;
        const blockSize = 8; // Process 8 elements at a time

        // Process in blocks for better performance
        for (let i = 0; i < len - (len % blockSize); i += blockSize) {
            // Dot product
            dotProduct += vec1[i] * vec2[i] +
                vec1[i + 1] * vec2[i + 1] +
                vec1[i + 2] * vec2[i + 2] +
                vec1[i + 3] * vec2[i + 3] +
                vec1[i + 4] * vec2[i + 4] +
                vec1[i + 5] * vec2[i + 5] +
                vec1[i + 6] * vec2[i + 6] +
                vec1[i + 7] * vec2[i + 7];

            // Norms
            norm1 += vec1[i] * vec1[i] +
                vec1[i + 1] * vec1[i + 1] +
                vec1[i + 2] * vec1[i + 2] +
                vec1[i + 3] * vec1[i + 3] +
                vec1[i + 4] * vec1[i + 4] +
                vec1[i + 5] * vec1[i + 5] +
                vec1[i + 6] * vec1[i + 6] +
                vec1[i + 7] * vec1[i + 7];

            norm2 += vec2[i] * vec2[i] +
                vec2[i + 1] * vec2[i + 1] +
                vec2[i + 2] * vec2[i + 2] +
                vec2[i + 3] * vec2[i + 3] +
                vec2[i + 4] * vec2[i + 4] +
                vec2[i + 5] * vec2[i + 5] +
                vec2[i + 6] * vec2[i + 6] +
                vec2[i + 7] * vec2[i + 7];
        }

        // Handle remaining elements
        for (let i = len - (len % blockSize); i < len; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        return norm1 && norm2 ? dotProduct / (norm1 * norm2) : 0;
    }

    /**
 * Berechnet die euklidische Distanz zwischen zwei Vektoren und konvertiert sie in einen Ähnlichkeitswert.
 * 
 * @method _calculateEuclideanSimilarity
 * @memberof VectorOperations
 * @param {number[]} vec1 - Der erste Vektor.
 * @param {number[]} vec2 - Der zweite Vektor.
 * @returns {number} Ein Ähnlichkeitswert zwischen 0 und 1.
 */
    _calculateEuclideanSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

        let squaredDistance = 0;
        const len = vec1.length;
        const blockSize = 8;

        // Process in blocks
        for (let i = 0; i < len - (len % blockSize); i += blockSize) {
            let diff0 = vec1[i] - vec2[i];
            let diff1 = vec1[i + 1] - vec2[i + 1];
            let diff2 = vec1[i + 2] - vec2[i + 2];
            let diff3 = vec1[i + 3] - vec2[i + 3];
            let diff4 = vec1[i + 4] - vec2[i + 4];
            let diff5 = vec1[i + 5] - vec2[i + 5];
            let diff6 = vec1[i + 6] - vec2[i + 6];
            let diff7 = vec1[i + 7] - vec2[i + 7];

            squaredDistance += diff0 * diff0 + diff1 * diff1 +
                diff2 * diff2 + diff3 * diff3 +
                diff4 * diff4 + diff5 * diff5 +
                diff6 * diff6 + diff7 * diff7;
        }

        // Handle remaining elements
        for (let i = len - (len % blockSize); i < len; i++) {
            let diff = vec1[i] - vec2[i];
            squaredDistance += diff * diff;
        }

        // Convert distance to similarity score (0 to 1)
        return Math.exp(-Math.sqrt(squaredDistance));
    }

    /**
 * Bereinigt den Cache, wenn die maximale Größe überschritten wird.
 * 
 * @method _cleanCache
 * @memberof VectorOperations
 */
    _cleanCache() {
        if (this.similarityCache.size > this.cacheMaxSize) {
            const entriesToKeep = Array.from(this.similarityCache.entries())
                .sort((a, b) => b[1].timestamp - a[1].timestamp)
                .slice(0, this.cacheMaxSize / 2);

            this.similarityCache.clear();
            entriesToKeep.forEach(([key, value]) => {
                this.similarityCache.set(key, value);
            });
        }
    }
}

module.exports = new VectorOperations({
    useCache: true,
    exactMatchWeight: 0.9,
    semanticWeight: 0.2,
    cacheMaxSize: 1000,
    cacheCleanupInterval: 300000 // 5 minutes
});