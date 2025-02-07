/**
 * @fileoverview Diese Datei enthält den Worker zur Ordner-Vorschlagserstellung.
 * Sie ermöglicht die Berechnung von Ähnlichkeiten und Clustering von Dokument- und Ordner-Embeddings.
 * 
 * @author Lennart
 */


const { parentPort } = require('worker_threads');
const { runClustering } = require('../models/modelClustering');

/**
 * Lauscht auf eingehende Nachrichten vom Hauptthread und führt entsprechende Aktionen aus.
 * Unterstützt Gesundheitschecks und führt Clustering-Operationen durch.
 * 
 * @param {Object} task - Das empfangene Task-Objekt.
 * @param {string} task.type - Der Typ der Aufgabe (`HEALTH_CHECK` oder Clustering-Aufgabe).
 * @param {Array<number>} [task.docEmbedding] - Das Embedding des zu analysierenden Dokuments.
 * @param {Array<Object>} [task.folderVectors] - Eine Liste von Ordnern mit ihren Embeddings.
 * @param {Object} [task.config] - Konfiguration für das Clustering.
 */
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

/**
 * Verarbeitet die Clustering-Ergebnisse und berechnet die besten Ordner-Vorschläge.
 * 
 * @function processSuggestions
 * @param {Object} clusteringResults - Das Ergebnis des Clustering-Prozesses.
 * @param {Array<number>} docEmbedding - Das Embedding des Dokuments.
 * @param {Array<Object>} folderVectors - Eine Liste von Ordnern mit ihren Embeddings.
 * @param {Object} config - Konfigurationsoptionen für die Berechnung.
 * @returns {Array<Object>} Eine sortierte Liste von Ordner-Vorschlägen mit Metadaten.
 */
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

/**
 * Berechnet die Kosinus-Ähnlichkeit zwischen zwei Vektoren.
 * 
 * @function calculateCosineSimilarity
 * @param {Array<number>} vec1 - Der erste Vektor.
 * @param {Array<number>} vec2 - Der zweite Vektor.
 * @returns {number} Ein Wert zwischen -1 und 1, der die Ähnlichkeit der beiden Vektoren beschreibt.
 */
function calculateCosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (norm1 * norm2);
}