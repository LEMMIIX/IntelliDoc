/**
 * Diese Datei enthält die Implementierung einer Engine zur Ordner-Vorschlagserstellung.
 * Sie ermöglicht die Berechnung von Ähnlichkeiten zwischen Dokument- und Ordner-Embeddings und gibt passende Ordner-Vorschläge zurück.
 *
 * @autor Lennart, Luca
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

const { performance } = require('perf_hooks');
const db = require('../../ConnectPostgres');
const vectorOps = require('./modelVectorOperations');

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

    async _calculateSimilarity(embedding1, embedding2, cacheKey = null) {
        if (cacheKey && this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }

        try {
            const similarity = vectorOps.calculateSimilarity(embedding1, embedding2);

            if (cacheKey && similarity > this.similarityThreshold * 0.8) {
                this.similarityCache.set(cacheKey, similarity);
            }

            return similarity;
        } catch (error) {
            console.error('Error calculating similarity:', error);
            return 0;
        }
    }

    async _processSuggestions(docEmbedding, folders) {
        const suggestions = [];
    
        try {
            for (const folder of folders) {
                const similarity = await this._calculateSimilarity(
                    docEmbedding,
                    folder.embedding,
                    folder.folder_id
                );
    
                // Remove the similarity threshold check to get all suggestions
                suggestions.push({
                    folderId: folder.folder_id,
                    folderName: folder.folder_name,
                    similarity: parseFloat(similarity.toFixed(4)),
                    fileCount: folder.file_count,
                    parentId: folder.parent_folder_id,
                    recentFiles: folder.recent_files,
                    confidence: this._calculateConfidence(similarity, folder)
                });
            }
    
            // Nach �hnlichkeit sortieren und die besten Vorschl�ge ausw�hlen
            return suggestions
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, this.maxSuggestions);  // immer maxSuggestions number of folders zur�ckgeben
        } catch (error) {
            console.error('Error processing suggestions:', error);
            return [];
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

    _calculateConfidence(similarity, folder) {
        const baseFactor = 0.7;
        const fileCountFactor = Math.min(folder.file_count / 10, 0.2);
        const recentFilesFactor = folder.recent_files?.length ? 0.1 : 0;
        
        return similarity;
    }

    _hashEmbedding(embedding) {
        return Buffer.from(embedding.join(',')).toString('base64').slice(0, 10);
    }

    _cacheResult(key, value) {
        this.similarityCache.set(key, value);
        if (this.similarityCache.size > 1000) {
            const firstKey = this.similarityCache.keys().next().value;
            this.similarityCache.delete(firstKey);
        }
    }
}

module.exports = new FolderSuggestionEngine({
    similarityThreshold: 0.75,
    maxSuggestions: 3
});