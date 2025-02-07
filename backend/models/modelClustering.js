/**
 * @fileoverview Diese Datei enthält Funktionen zur Durchführung von Clustering-Operationen 
 * auf Dokument- und Ordner-Embeddings. Sie ermöglicht das Abrufen von Ordnerdaten, das 
 * Zuordnen von Dokumenten zu Ordnern und das Ausführen eines Clustering-Skripts.
 * 
 * @author Lennart
 * Die Funktionen wurden mit Unterstützung von KI-Tools angepasst und optimiert.
 */


const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const db = require('../../ConnectPostgres');

/**
 * Ruft die Ordnerdaten eines Benutzers ab, einschließlich Embeddings, Namen und Hierarchie.
 *
 * @async
 * @function getFolderData
 * @param {number} userId - Die ID des Benutzers, für den die Ordnerdaten abgerufen werden.
 * @returns {Promise<Object>} Ein Objekt mit `embeddings`, `names` und `hierarchy`.
 */
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
        // Zeichenketten-Embedding bei Bedarf in ein Array konvertieren
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

/**
 * Erstellt eine Zuordnung von Dokumenten zu ihren Ordnern für einen bestimmten Benutzer.
 *
 * @async
 * @function getDocumentFolderMap
 * @param {number} userId - Die ID des Benutzers, dessen Dokument-Ordner-Zuordnung abgerufen wird.
 * @returns {Promise<Object>} Ein Objekt, das die Datei-IDs den Ordner-IDs zuordnet.
 */
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

/**
 * Führt ein Clustering von Dokument- und Ordner-Embeddings durch.
 *
 * @async
 * @function runClustering
 * @param {Array<Object>} embeddings - Eine Liste von Dokument-Embeddings.
 * @param {Object} [config={}] - Konfigurationsoptionen für das Clustering.
 * @param {number} userId - Die Benutzer-ID für Sicherheitszwecke.
 * @returns {Promise<Object>} Ein Objekt mit Clustering-Ergebnissen einschließlich Labels und Statistiken.
 * @throws {Error} Falls ein ungültiges Embedding-Format oder ein Fehler während der Ausführung auftritt.
 * @example
 * const result = await runClustering(docEmbeddings, { semanticThreshold: 0.8 }, 123);
 * console.log(result);
 */
async function runClustering(embeddings, config = {}, userId) {
    if (!userId) {
        throw new Error('userId is required for security purposes');
    }

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

                // Erweiterte Ordnerdaten abrufen, wenn userId angegeben ist
                let clusteringData = { doc_embeddings: formattedDocEmbeddings };
                let folderData = null;

                if (userId) {
                    const [folders, docToFolderMap] = await Promise.all([
                        getFolderData(userId),
                        getDocumentFolderMap(userId)
                    ]);

                    folderData = folders; // speichrt die Ordnerdaten für die spätere Verwendung

                    clusteringData = {
                        doc_embeddings: formattedDocEmbeddings,
                        folder_embeddings: folders.embeddings,
                        folder_names: folders.names,
                        folder_hierarchy: folders.hierarchy,
                        doc_to_folder_map: docToFolderMap
                    };
                }

                // erstellt temporary files
                const tempEmbeddingsPath = path.join(os.tmpdir(), `embeddings_${Date.now()}.json`);
                const tempConfigPath = path.join(os.tmpdir(), `config_${Date.now()}.json`);

                // enhanced config
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
                        // löscht die temporären Dateien
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