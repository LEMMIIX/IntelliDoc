const { spawn } = require('child_process');
const path = require('path');
const db = require('../../ConnectPostgres');
const { performance } = require('perf_hooks');
const EventEmitter = require('events');

class GenerationQueue extends EventEmitter {
    constructor(concurrency = 2) {
        super();
        this.queue = [];
        this.running = 0;
        this.concurrency = concurrency;
    }

    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.running >= this.concurrency || this.queue.length === 0) return;

        this.running++;
        const { task, resolve, reject } = this.queue.shift();

        try {
            const result = await task();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.running--;
            this.process();
        }
    }
}

class FolderNameGenerator {
    constructor(options = {}) {
        // Core configuration
        this.pythonScript = path.join(__dirname, 'folderNameGenerator.py');
        this.similarityThreshold = options.similarityThreshold || 0.75;
        this.timeout = options.timeout || 30000;
        this.maxRetries = options.maxRetries || 2;
        this.queue = new GenerationQueue(options.concurrency || 2);
        
        // Cache and metrics
        this.similarityCache = new Map();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastError: null
        };
    }

    async shouldCreateNewFolder(docEmbedding, userId) {
        const startTime = performance.now();
        
        try {
            const query = `
                SELECT 
                    f.folder_id,
                    f.folder_name,
                    f.embedding,
                    f.parent_folder_id,
                    COUNT(fl.file_id) as file_count
                FROM main.folders f
                LEFT JOIN main.files fl ON f.folder_id = fl.folder_id
                WHERE f.user_id = $1 
                AND f.embedding IS NOT NULL
                GROUP BY f.folder_id
            `;
            
            const result = await db.query(query, [userId]);
            
            if (result.rows.length === 0) {
                return {
                    shouldCreate: true,
                    reason: 'no_existing_folders',
                    processingTime: performance.now() - startTime
                };
            }

            let maxSimilarity = 0;
            let mostSimilarFolder = null;
            const similarities = [];

            for (const folder of result.rows) {
                const similarity = await this._calculateSimilarity(
                    docEmbedding,
                    folder.embedding,
                    folder.folder_id
                );
                
                similarities.push({
                    folderId: folder.folder_id,
                    folderName: folder.folder_name,
                    similarity,
                    fileCount: folder.file_count,
                    parentId: folder.parent_folder_id
                });

                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    mostSimilarFolder = folder;
                }
            }

            similarities.sort((a, b) => b.similarity - a.similarity);

            return {
                shouldCreate: maxSimilarity < this.similarityThreshold,
                reason: maxSimilarity < this.similarityThreshold ? 'semantic_divergence' : 'similar_folder_exists',
                similarFolder: mostSimilarFolder ? {
                    id: mostSimilarFolder.folder_id,
                    name: mostSimilarFolder.folder_name,
                    similarity: maxSimilarity,
                    fileCount: mostSimilarFolder.file_count,
                    parentId: mostSimilarFolder.parent_folder_id
                } : null,
                topSimilarities: similarities.slice(0, 3),
                processingTime: performance.now() - startTime
            };
        } catch (error) {
            console.error('Error in shouldCreateNewFolder:', error);
            throw error;
        }
    }

    async generateFolderNames(textContent, userId, options = {}) {
        const startTime = performance.now();
        this.metrics.totalRequests++;

        try {
            const existingFolders = await this._getExistingFolderNames(userId);
            const result = await this._queueGenerationTask(textContent, existingFolders, options);
            
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

    async regenerateNames(textContent, userId, excludeNames = [], options = {}) {
        try {
            const existingFolders = await this._getExistingFolderNames(userId);
            const allExclusions = [...new Set([...existingFolders, ...excludeNames])];
            return await this._queueGenerationTask(textContent, allExclusions, options);
        } catch (error) {
            console.error('Error in regenerateNames:', error);
            throw error;
        }
    }

    async _queueGenerationTask(textContent, existingFolders, params) {
        let lastError;
        
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.queue.add(() => 
                    this._generateNames(textContent, existingFolders, params)
                );
            } catch (error) {
                lastError = error;
                if (attempt < this.maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                }
            }
        }
        
        throw lastError;
    }

    async _getExistingFolderNames(userId) {
        const query = `
            SELECT folder_name 
            FROM main.folders 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await db.query(query, [userId]);
        return result.rows.map(row => row.folder_name);
    }

    async _generateNames(textContent, existingFolders, params) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                this.pythonScript,
                '--language', params.language || 'en',
                '--num_suggestions', params.numSuggestions || '3'
            ]);
    
            let outputData = '';
            let errorData = '';
            
            const timeoutId = setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Generation timeout'));
            }, this.timeout);

            const modelInput = {
                text: textContent,
                existingFolders,
                params
            };

            pythonProcess.stdin.write(JSON.stringify(modelInput));
            pythonProcess.stdin.end();
    
            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });
    
            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });
    
            pythonProcess.on('close', (code) => {
                clearTimeout(timeoutId);
    
                if (code !== 0) {
                    reject(new Error(`Generation failed (${code}): ${errorData}`));
                    return;
                }
    
                try {
                    const result = JSON.parse(outputData);
                    
                    if (!result.suggestions || !Array.isArray(result.suggestions)) {
                        throw new Error('Invalid response format');
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to parse Python output: ${error.message}`));
                }
            });
        });
    }

    async _calculateSimilarity(embedding1, embedding2, cacheKey = null) {
        if (cacheKey && this.similarityCache.has(cacheKey)) {
            return this.similarityCache.get(cacheKey);
        }

        const vec1 = this._parseEmbedding(embedding1);
        const vec2 = this._parseEmbedding(embedding2);

        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        
        const similarity = dotProduct / (norm1 * norm2);

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
            queueSize: this.queue.queue.length,
            activeGenerations: this.queue.running,
            cacheSize: this.similarityCache.size
        };
    }

    clearCache() {
        this.similarityCache.clear();
    }
}

module.exports = new FolderNameGenerator({
    similarityThreshold: 0.75,
    timeout: 30000,
    maxRetries: 2,
    concurrency: 2
});