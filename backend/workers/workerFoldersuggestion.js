/**
 * Diese Datei enthält den Worker zur Ordner-Vorschlagserstellung.
 * Sie ermöglicht die Berechnung von Ähnlichkeiten und Clustering von Dokument- und Ordner-Embeddings.
 *
 * @autor Lennart. 
 * Die Funktionen sind mit Ki generiert und optimiert
 */

const { parentPort } = require('worker_threads');
const { runClustering } = require('../models/modelClustering');

parentPort.on('message', async (task) => {
    if (task.type === 'HEALTH_CHECK') {
        parentPort.postMessage({ type: 'HEALTH_CHECK', status: 'healthy' });
        return;
    }
    
    try {
        const { docEmbedding, folderVectors, config } = task;
        
        // Prepare clustering input
        const clusteringInput = {
            embeddings: [docEmbedding, ...folderVectors.map(f => f.embedding)],
            documentIndex: 0
        };

        // Run clustering in worker
        const clusteringResults = await runClustering(
            clusteringInput.embeddings,
            {
                minClusterSize: 2,
                semanticThreshold: config.similarityThreshold,
                anchorInfluence: config.clusterInfluence
            }
        );

        // Process results
        const suggestions = processSuggestions(
            clusteringResults,
            docEmbedding,
            folderVectors,
            config
        );

        parentPort.postMessage({
            success: true,
            suggestions
        });

    } catch (error) {
        parentPort.postMessage({
            success: false,
            error: error.message
        });
    }
});

function processSuggestions(clusteringResults, docEmbedding, folderVectors, config) {
    const documentCluster = clusteringResults.labels[0];
    
    return folderVectors
        .map((folder, index) => {
            const folderCluster = clusteringResults.labels[index + 1];
            const similarity = calculateCosineSimilarity(docEmbedding, folder.embedding);
            
            const clusterBoost = 
                documentCluster === folderCluster && documentCluster !== -1
                    ? config.clusterInfluence
                    : 0;

            return {
                folderId: folder.folder_id,
                folderName: folder.folder_name,
                similarity: similarity * (1 + clusterBoost),
                fileCount: folder.file_count,
                recentFiles: folder.recent_files,
                parentId: folder.parent_folder_id,
                hasChildren: folder.has_children,
                avgFileSimilarity: folder.avg_file_similarity,
                clusterContext: {
                    inSameCluster: documentCluster === folderCluster,
                    clusterLabel: folderCluster
                }
            };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, config.maxSuggestions);
}

function calculateCosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (norm1 * norm2);
}