const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * @typedef {Object} ClusteringConfig
 * @property {number} [minClusterSize=3] - Minimum size for a cluster
 * @property {number} [minSamples=2] - Number of samples in neighborhood for core points
 * @property {string} [clusterSelectionMethod='eom'] - Method for cluster selection ('eom' or 'leaf')
 * @property {number} [clusterSelectionEpsilon=0.0] - Distance threshold for expanding clusters
 */

/**
 * Run clustering on embeddings with optional configuration
 * @param {Array} embeddings - Array of embeddings to cluster
 * @param {ClusteringConfig} [config] - Optional clustering configuration
 * @returns {Promise<Array>} Array of cluster labels
 */
async function runClustering(embeddings, config = {}) {
    return new Promise((resolve, reject) => {
        // Format embeddings
        const formattedEmbeddings = embeddings.map(emb => {
            if (typeof emb === 'string') {
                return emb.replace(/[\[\]]/g, '').split(',').map(Number);
            }
            if (Array.isArray(emb)) {
                return emb.map(Number);
            }
            if (emb.embedding) {
                if (typeof emb.embedding === 'string') {
                    return emb.embedding.replace(/[\[\]]/g, '').split(',').map(Number);
                }
                return emb.embedding.map(Number);
            }
            throw new Error('Invalid embedding format');
        });

        // Create temporary files for embeddings and config
        const tempEmbeddingsPath = path.join(os.tmpdir(), `embeddings_${Date.now()}.json`);
        const tempConfigPath = path.join(os.tmpdir(), `config_${Date.now()}.json`);
        
        // Save embeddings and config to temporary files
        fs.writeFileSync(tempEmbeddingsPath, JSON.stringify(formattedEmbeddings));
        fs.writeFileSync(tempConfigPath, JSON.stringify(config));

        const scriptPath = path.join(__dirname, '../models/cluster.py');

        // Execute Python script with both file paths
        exec(`python ${scriptPath} ${tempEmbeddingsPath} ${tempConfigPath}`, (error, stdout, stderr) => {
            // Clean up temporary files
            fs.unlinkSync(tempEmbeddingsPath);
            fs.unlinkSync(tempConfigPath);

            if (error) {
                console.error(`Error executing clustering script: ${error}`);
                console.error(`stderr: ${stderr}`);
                reject(error);
                return;
            }
            
            try {
                const clusterLabels = JSON.parse(stdout);
                resolve(clusterLabels);
            } catch (parseError) {
                console.error('Error parsing clustering results:', parseError);
                reject(parseError);
            }
        });
    });
}

module.exports = {
    runClustering
};