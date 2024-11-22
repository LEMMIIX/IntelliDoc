// modelVectorOperations.js

const { performance } = require('perf_hooks');

class VectorOperations {
    constructor(options = {}) {
        this.useCache = options.useCache ?? true;
        this.exactMatchWeight = options.exactMatchWeight || 0.9;
        this.semanticWeight = options.semanticWeight || 0.2;
        this.similarityCache = new Map();
        this.lastCacheClean = Date.now();
        this.cacheMaxSize = options.cacheMaxSize || 1000;
        this.cacheCleanupInterval = options.cacheCleanupInterval || 1000 * 60 * 5; // 5 minutes
    }

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

    // Cache management methods
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