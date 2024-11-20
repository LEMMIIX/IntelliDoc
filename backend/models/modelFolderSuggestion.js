const { Worker } = require('worker_threads');
const path = require('path');
const { performance } = require('perf_hooks');
const db = require('../../ConnectPostgres');

class FolderSuggestionEngine {
    constructor(options = {}) {
        this.similarityThreshold = options.similarityThreshold || 0.75;
        this.maxSuggestions = options.maxSuggestions || 3;
        this.similarityCache = new Map();
        
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastError: null
        };
    }

    async getSuggestedFolders({ docEmbedding, userId }) {
        const startTime = performance.now();
        this.metrics.totalRequests++;
        
        const cacheKey = `folder_suggestions:${userId}:${this._hashEmbedding(docEmbedding)}`;

        try {
            // Check memory cache
            if (this.similarityCache.has(cacheKey)) {
                return this.similarityCache.get(cacheKey);
            }

            const foldersData = await this._getFolderData(userId);
            
            if (foldersData.rows.length === 0) {
                const result = {
                    suggestedFolders: [],
                    processingTime: performance.now() - startTime
                };
                this._cacheResult(cacheKey, result);
                return result;
            }

            const suggestions = await this._processSuggestions(
                docEmbedding,
                foldersData.rows
            );

            const result = {
                suggestedFolders: suggestions.slice(0, this.maxSuggestions),
                processingTime: performance.now() - startTime
            };

            this._cacheResult(cacheKey, result);

            this.metrics.successfulRequests++;
            this.metrics.averageResponseTime = 
                (this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1) + 
                (performance.now() - startTime)) / this.metrics.successfulRequests;

            return result;

        } catch (error) {
            this.metrics.failedRequests++;
            this.metrics.lastError = error.message;
            throw error;
        }
    }

    async _getFolderData(userId) {
        const query = `
            WITH RankedFiles AS (
                SELECT 
                    f.folder_id,
                    f.folder_name,
                    f.embedding,
                    f.parent_folder_id,
                    fl.file_name,
                    ROW_NUMBER() OVER (PARTITION BY f.folder_id ORDER BY fl.uploaded_at DESC) as rn
                FROM main.folders f
                LEFT JOIN main.files fl ON f.folder_id = fl.folder_id
                WHERE f.user_id = $1 
                AND f.embedding IS NOT NULL
            )
            SELECT 
                folder_id,
                folder_name,
                embedding,
                parent_folder_id,
                COUNT(file_name) as file_count,
                array_agg(
                    CASE WHEN rn <= 5 THEN file_name ELSE NULL END
                ) FILTER (WHERE rn <= 5) as recent_files
            FROM RankedFiles
            GROUP BY folder_id, folder_name, embedding, parent_folder_id
        `;
        
        return await db.query(query, [userId]);
    }

    async _processSuggestions(docEmbedding, folders) {
        const suggestions = [];

        for (const folder of folders) {
            const similarity = await this._calculateSimilarity(
                docEmbedding,
                folder.embedding,
                folder.folder_id
            );

            suggestions.push({
                folderId: folder.folder_id,
                folderName: folder.folder_name,
                similarity: similarity,
                fileCount: folder.file_count,
                parentId: folder.parent_folder_id,
                recentFiles: folder.recent_files
            });
        }

        return suggestions.sort((a, b) => b.similarity - a.similarity);
    }

    _cacheResult(key, value) {
        this.similarityCache.set(key, value);
        // Basic cache cleanup
        if (this.similarityCache.size > 1000) {
            const firstKey = this.similarityCache.keys().next().value;
            this.similarityCache.delete(firstKey);
        }
    }

    _hashEmbedding(embedding) {
        return Buffer.from(embedding.join(',')).toString('base64').slice(0, 10);
    }

    async _calculateSimilarity(embedding1, embedding2, cacheKey = null) {
        if (cacheKey && this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }
    
        const vec1 = this._parseEmbedding(embedding1);
        const vec2 = this._parseEmbedding(embedding2);
    
        const exactMatchWeight = 0.9;
        const semanticWeight = 0.2;
    
        // Cosine similarity for semantic matching
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        const cosineSim = dotProduct / (norm1 * norm2);
    
        // Euclidean distance for exact matching
        const euclideanDist = Math.sqrt(vec1.reduce((sum, val, i) => {
            const diff = val - vec2[i];
            return sum + diff * diff;
        }, 0));
        const exactMatchScore = Math.exp(-euclideanDist);
    
        const similarity = (exactMatchWeight * exactMatchScore) + (semanticWeight * cosineSim);
    
        if (cacheKey) {
            this.similarityCache.set(cacheKey, similarity);
        }
    
        return similarity;
    }

    _parseEmbedding(embedding) {
        return typeof embedding === 'string'
            ? embedding.replace(/[{}\[\]]/g, '').split(',').map(Number)
            : embedding;
    }

    getMetrics() {
        return {
            ...this.metrics,
            cacheSize: this.similarityCache.size
        };
    }

    clearCache() {
        this.similarityCache.clear();
    }
}

module.exports = new FolderSuggestionEngine({
    similarityThreshold: 0.75,
    maxSuggestions: 3
});