const db = require('../../ConnectPostgres');
const path = require('path');
const mammoth = require('mammoth');
// E/F: Added new imports for text extraction and embedding generation
const { extractTextContent } = require('../models/modelFileReader');
const modelEmbedding = require('../models/modelEmbedding');
const modelClustering = require('../models/modelClustering');
const { generateKeywords } = require('../models/modelKeywords');

exports.renderUploadForm = (req, res) => {
    // Liefere die statische HTML-Datei aus
    res.sendFile(path.join(__dirname, '../../frontend/html/docupload.html'));
};

exports.uploadFile = async (req, res) => {
    try {
        // Überprüfen, ob req.file tatsächlich vorhanden ist
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const { originalname, buffer, mimetype } = req.file;
        const { folderId, clusteringParams } = req.body;  // Add clusteringParams to body
        const userId = req.session.userId;

        // Konvertiere folderId in eine Ganzzahl, wenn möglich
        const folderIdInt = parseInt(folderId, 10);
        // Falls folderId leer ist oder keine gültige Zahl ist, auf NULL setzen
        const folderIdToUse = isNaN(folderIdInt) ? null : folderIdInt;

        console.log('Extracting text content...');
        const textContent = await extractTextContent(buffer, mimetype, originalname);
        console.log(`Extracted text length: ${textContent.length} characters`);
        
        const embedding = await modelEmbedding.generateEmbedding(textContent);

        //console.log('Inserting into database...');
        // Format the embedding as a PostgreSQL array
        const formattedEmbedding = `[${embedding.join(',')}]`;

        // Check if a file with the same name already exists
        const checkQuery = `
            SELECT file_id, version
            FROM main.files
            WHERE file_name = $1 AND user_id = $2
            ORDER BY version DESC
            LIMIT 1;
        `;
        const checkResult = await db.query(checkQuery, [originalname, userId]);

        console.log('Insertion complete.');
        //console.log('Executing database query:', { text: query, params: values.map((v, i) => i === 3 ? '<Buffer>' : v) });

        let version = 1;
        let originalFileId = null;

        if (checkResult.rows.length > 0) {
            // Increment the version number if a file with the same name exists
            version = checkResult.rows[0].version + 1;
            originalFileId = checkResult.rows[0].file_id;
        }

        const insertQuery = `
            INSERT INTO main.files (user_id, file_name, file_type, file_data, folder_id, embedding, version, original_file_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING file_id;
        `;
        const values = [userId, originalname, mimetype, buffer, folderIdToUse, formattedEmbedding, version, originalFileId];

        const result = await db.query(insertQuery, values);
        const fileId = result.rows[0].file_id;
        generateKeywordsInBackground(textContent, fileId);

        // Get all embeddings
        const allEmbeddings = await modelEmbedding.getAllEmbeddings();
        console.log(`Total documents for clustering: ${allEmbeddings.length}`);
        
        // Extract and verify embeddings
        const existingEmbeddings = allEmbeddings.map(item => {
            let emb = item.embedding;
            if (typeof emb === 'string') {
                emb = emb.replace(/[\[\]]/g, '').split(',').map(Number);
            }
            if (!Array.isArray(emb) || emb.length !== 768) {
                console.warn(`Warning: Invalid embedding format for file ID ${item.fileId}. Length: ${emb.length}`);
            }
            return emb;
        });

        // Add new embedding
        existingEmbeddings.push(embedding);

        // Clustering parameters
        const defaultParams = {
            minClusterSize: 3,
            minSamples: 2,
            clusterSelectionMethod: 'eom',
            clusterSelectionEpsilon: 0.18,
            anchorInfluence: 0.36,         // Changed from folder_weight
            semanticThreshold: 0.52        // Changed from semantic_similarity_threshold
        };

        // Merge default parameters with any provided parameters
        const clusteringConfig = {
            ...defaultParams,
            ...JSON.parse(clusteringParams || '{}')  // Allow overriding defaults through API
        };

        // Run clustering with parameters and debug info
        console.log('Starting clustering process with parameters:', clusteringConfig);
        const clusteringResult = await modelClustering.runClustering(
            existingEmbeddings, 
            clusteringConfig,
            userId
        );
        

        const clusterLabels = clusteringResult.labels;
        const clusterStats = clusteringResult.clusterStats;
        const folderContext = clusteringResult.folderContext;

        console.log('Clustering complete. Results:', clusterLabels);

        // Update cluster labels
        for (let i = 0; i < clusterLabels.length; i++) {
            const updateQuery = 'UPDATE main.files SET cluster_label = $1 WHERE file_id = $2';
            const fileIdToUpdate = i < allEmbeddings.length ? allEmbeddings[i].fileId : fileId;
            await db.query(updateQuery, [clusterLabels[i], fileIdToUpdate]);
        }

        res.status(201).json({ 
            message: 'File uploaded successfully', 
            fileId: fileId,
            clusteringResults: {
                totalDocuments: allEmbeddings.length + 1,
                uniqueClusters: clusterStats.num_clusters,
                noisePoints: clusterStats.noise_points,
                assignedCluster: clusterLabels[clusterLabels.length - 1],
                clusterSizes: clusterStats.cluster_sizes
            },
            ...(folderContext && {
                folderSuggestions: {
                    statistics: folderContext.statistics,
                    topAffinities: Object.entries(folderContext.affinities[clusterLabels.length - 1] || {})
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([folderId, score]) => ({
                            folderId,
                            folderName: folderContext.folderInfo.names[folderId],
                            score: Math.round(score * 100) / 100
                        }))
                }
            })
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(422).json({ message: 'Error processing file', error: error.message });
    }
};

// Keywords im Hintergrund generiert
const generateKeywordsInBackground = async (textContent,file_id) => {
    try {
        const keywords = await generateKeywords(textContent);

        // Verbinde die Keywords in eine Zeichenkette
        const keywordsString = keywords.join(', ');
        // Keywords in der Datenbank speichern
        const query = 'UPDATE main.files SET keywords = $1 WHERE file_id = $2';
        await db.query(query, [keywordsString, file_id]);
    } catch (error) {
        console.error('Error generating keywords:', error);
    }
};

exports.checkKeywordStatus = async (req, res) => {
    const fileId = req.params.fileId; // file.id vom url. 
    try {
        // database query. um keywords für den jeweiligen fileid abzurufen 
        const query = 'SELECT keywords FROM main.files WHERE file_id = $1';
        const result = await db.query(query, [fileId]);

        // reszlt in keywords einpacken und als res. senden. 
        const keywords = result["rows"][0]["keywords"];
        if (keywords) {
            // wenn keywords verfügbar sind. 
            res.json({keywords });
        } else {
            // warten wenn keywords noch nicht fertif sind. 
            res.json({ status: 'pending' });
        }
    } catch (error) {
        // Handle any errors that occur during the query
        console.error('Error checking keyword status:', error);
        res.status(500).json({ status: 'error', message: 'Fehler beim Abrufen der Keywords' });
    }
};

        if (keywords && keywords.length > 0) {
            res.status(200).json({ keywords: keywords.map(kw => kw.text) });
        } else {
            res.status(404).json({ message: 'No keywords found for this file.' });
        }
    } catch (error) {
        console.error('Error fetching keywords:', error);
        res.status(500).json({ message: 'An error occurred while fetching keywords.' });
    }
};

// download
exports.downloadFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const userId = req.session.userId;

        const query = 'SELECT file_data, file_type, file_name FROM main.files WHERE file_id = $1 AND user_id = $2';
        const result = await db.query(query, [fileId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).send('File not found');
        }

        const { file_data, file_type, file_name } = result.rows[0];

        res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
        res.setHeader('Content-Type', file_type);
        res.send(file_data);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const userId = req.session.userId;

        const query = 'DELETE FROM main.files WHERE file_id = $1 AND user_id = $2 RETURNING *';
        const result = await db.query(query, [fileId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'File not found or you do not have permission to delete it' });
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
};

exports.viewFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const userId = req.session.userId;

        const query = 'SELECT file_name, file_type, file_data, version, file_id FROM main.files WHERE file_id = $1 AND user_id = $2';
        const result = await db.query(query, [fileId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const document = result.rows[0];

        // Handle different file types
        if (document.file_type === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.send(document.file_data);
        } else if (document.file_type === 'text/plain') {
            res.setHeader('Content-Type', 'text/html');
            res.send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>View Text File</title>
                    <style>
                        .file-content {
                            background-color: #f4f4f4;
                            padding: 10px;
                            border: 1px solid #ddd;
                            margin-top: 20px;
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>
                    <h1>${document.file_name} (Version ${document.version})</h1>
                    <pre class="file-content">${document.file_data.toString()}</pre>
                </body>
                </html>
            `);
        } else if (document.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const docxBuffer = Buffer.from(document.file_data);
            const { value: htmlContent } = await mammoth.convertToHtml({ buffer: docxBuffer });
            
            res.setHeader('Content-Type', 'text/html');
            res.send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>View DOCX File</title>
                    <style>
                        .file-content {
                            background-color: #f4f4f4;
                            padding: 10px;
                            border: 1px solid #ddd;
                            margin-top: 20px;
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>
                    <h1>${document.file_name} (Version ${document.version})</h1>
                    <div class="file-content">${htmlContent}</div>
                </body>
                </html>
            `);
        } else {
            res.setHeader('Content-Type', document.file_type);
            res.send(document.file_data);
        }
    } catch (err) {
        console.error('Error fetching document:', err.stack);
        res.status(500).json({ error: 'Error fetching document', details: err.stack });
    }
};

//////// getVersionHistory --- neue Dokumentation für Frontend !!!
//          |
//          |
//          |
//          |
//          V


/**
 * Retrieves the complete version history for a document based on any version's fileId.
 * 
 * The function works by:
 * 1. Finding the original document using the provided fileId
 * 2. Using the file name to retrieve all versions
 * 3. Returning a sorted list of all versions with metadata
 * 
 * @route GET /versions/:fileId
 * @param {string} req.params.fileId - The ID of any version of the file
 * @param {string} req.session.userId - User ID from session (for authorization)
 * 
 * @returns {Object} Response object
 * @returns {string} Response.fileName - The original name of the file
 * @returns {Array<Object>} Response.versions - Array of version objects
 * @returns {string} Response.versions[].file_id - Unique identifier for each version
 * @returns {number} Response.versions[].version - Version number (starts at 1)
 * @returns {Date} Response.versions[].created_at - Timestamp of version creation
 * 
 * @example
 * // Frontend API call
 * const response = await fetch(`/api/versions/${fileId}`);
 * const versionHistory = await response.json();
 * 
 * // Response example:
 * {
 *   fileName: "document.pdf",
 *   versions: [
 *     {
 *       file_id: "123",
 *       version: 2,
 *       created_at: "2024-11-07T14:30:00Z"
 *     },
 *     {
 *       file_id: "122",
 *       version: 1,
 *       created_at: "2024-11-07T12:00:00Z"
 *     }
 *   ]
 * }
 * 
 * @errorResponse {404} File not found
 * @errorResponse {500} Server error during retrieval
 */
exports.getVersionHistory = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const userId = req.session.userId;

        // First get the file details for the provided fileId
        const fileQuery = `
            SELECT original_file_id, file_name
            FROM main.files
            WHERE file_id = $1 AND user_id = $2;
        `;
        const fileResult = await db.query(fileQuery, [fileId, userId]);

        if (fileResult.rows.length === 0) {
            return res.status(404).json({ 
                error: 'File not found',
                details: 'The specified file ID does not exist or you do not have access to it'
            });
        }

        const fileName = fileResult.rows[0].file_name;
        
        // Retrieve all versions of the file using the file name
        // Files are considered versions of each other if they share the same name
        const versionsQuery = `
            SELECT 
                file_id,      -- Unique identifier for each version
                version,      -- Version number (auto-incremented)
                created_at    -- Timestamp when this version was created
            FROM main.files
            WHERE file_name = $1 AND user_id = $2
            ORDER BY version DESC;  -- Latest version first
        `;
        const versionsResult = await db.query(versionsQuery, [fileName, userId]);

        // Return formatted response with file name and version array
        res.json({ 
            fileName: fileName,
            versions: versionsResult.rows 
        });
    } catch (error) {
        console.error('Error fetching version history:', error);
        res.status(500).json({ 
            error: 'Error fetching version history',
            details: 'An internal server error occurred while retrieving the version history'
        });
    }
};

/**
 * Database Schema Reference (main.files table)
 * 
 * Relevant columns for versioning:
 * - file_id (PK): Unique identifier for each file version
 * - file_name: Name of the file (used to group versions)
 * - version: Auto-incrementing version number for files with the same name
 * - created_at: Timestamp of upload
 * - user_id (FK): Reference to user who owns the file
 * 
 * Version Handling Logic:
 * 1. When a file is uploaded, the system checks if a file with the same name exists
 * 2. If it exists, the new file gets the next version number
 * 3. All versions of a file share the same file_name but have unique file_ids
 * 
 * Frontend Usage Notes:
 * - Use this endpoint to build version history displays
 * - The versions array is pre-sorted (newest first)
 * - Each version's file_id can be used with other endpoints:
 *   - /download/:fileId (to download specific versions)
 *   - /view/:fileId (to view specific versions)
 *   - /delete/:fileId (to delete specific versions)
 */
