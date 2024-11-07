const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const db = require('../../ConnectPostgres');

async function getFolderData(userId) {
    const query = `
        SELECT 
            folder_id,
            folder_name,
            embedding,
            parent_folder_id
        FROM main.folders 
        WHERE user_id = $1 
        AND embedding IS NOT NULL
    `;
    
    const result = await db.query(query, [userId]);
    
    const embeddings = {};
    const names = {};
    const hierarchy = {};
    
    result.rows.forEach(row => {
        // Convert string embedding to array if needed
        let embedding = row.embedding;
        if (typeof embedding === 'string') {
            embedding = embedding.replace(/[\[\]]/g, '').split(',').map(Number);
        }
        embeddings[row.folder_id] = embedding;
        names[row.folder_id] = row.folder_name;
        hierarchy[row.folder_id] = row.parent_folder_id;
    });
    
    return { embeddings, names, hierarchy };
}

async function getDocumentFolderMap(userId) {
    const query = `
        SELECT file_id, folder_id 
        FROM main.files 
        WHERE user_id = $1 
        AND folder_id IS NOT NULL
    `;
    
    const result = await db.query(query, [userId]);
    
    return result.rows.reduce((acc, row) => {
        acc[row.file_id] = row.folder_id.toString();
        return acc;
    }, {});
}

async function runClustering(embeddings, config = {}, userId) {
    return new Promise((resolve, reject) => {
        const processingFunction = async () => {
            try {
                // Format document embeddings
                const formattedDocEmbeddings = embeddings.map(emb => {
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

                // Get enhanced folder data if userId is provided
                let clusteringData = { doc_embeddings: formattedDocEmbeddings };
                let folderData = null;
                
                if (userId) {
                    const [folders, docToFolderMap] = await Promise.all([
                        getFolderData(userId),
                        getDocumentFolderMap(userId)
                    ]);
                    
                    folderData = folders; // Store for later use
                    
                    clusteringData = {
                        doc_embeddings: formattedDocEmbeddings,
                        folder_embeddings: folders.embeddings,
                        folder_names: folders.names,
                        folder_hierarchy: folders.hierarchy,
                        doc_to_folder_map: docToFolderMap
                    };
                }

                // Create temporary files
                const tempEmbeddingsPath = path.join(os.tmpdir(), `embeddings_${Date.now()}.json`);
                const tempConfigPath = path.join(os.tmpdir(), `config_${Date.now()}.json`);

                // Enhanced configuration
                const enhancedConfig = {
                    ...config,
                    anchorInfluence: config.anchorInfluence || 0.45,
                    semanticThreshold: config.semanticThreshold || 0.7
                };

                // Save data and config
                fs.writeFileSync(tempEmbeddingsPath, JSON.stringify(clusteringData));
                fs.writeFileSync(tempConfigPath, JSON.stringify(enhancedConfig));

                const scriptPath = path.join(__dirname, 'cluster.py');

                // Execute Python clustering script
                const pythonProcess = exec(
                    `python "${scriptPath}" "${tempEmbeddingsPath}" "${tempConfigPath}"`,
                    { maxBuffer: 1024 * 1024 * 10 },
                    async (error, stdout, stderr) => {
                        // Clean up temp files
                        try {
                            fs.unlinkSync(tempEmbeddingsPath);
                            fs.unlinkSync(tempConfigPath);
                        } catch (cleanupError) {
                            console.error('Error cleaning up temp files:', cleanupError);
                        }

                        if (stderr) {
                            console.error(`Clustering output: ${stderr}`);
                        }

                        if (error) {
                            console.error(`Clustering execution error: ${error}`);
                            reject(error);
                            return;
                        }

                        try {
                            if (!stdout.trim()) {
                                throw new Error('No output from clustering script');
                            }

                            const result = JSON.parse(stdout.trim());
                            
                            if (result.error) {
                                reject(new Error(result.error));
                                return;
                            }

                            // Process enhanced clustering results
                            const processedResult = {
                                labels: result.labels,
                                clusterStats: result.clustering_stats,
                                folderContext: null
                            };

                            // Add folder context if available
                            if (result.folder_context && folderData) {
                                processedResult.folderContext = {
                                    affinities: result.folder_context.affinities,
                                    statistics: result.folder_context.statistics,
                                    folderInfo: {
                                        names: folderData.names,
                                        hierarchy: folderData.hierarchy
                                    }
                                };
                            }

                            resolve(processedResult);
                        } catch (parseError) {
                            console.error('Raw clustering output:', stdout);
                            console.error('Parse error:', parseError);
                            reject(parseError);
                        }
                    }
                );

                pythonProcess.on('error', (error) => {
                    console.error('Process error:', error);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        };

        processingFunction().catch(reject);
    });
}

module.exports = { runClustering };