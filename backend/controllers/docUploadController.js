const db = require('../../ConnectPostgres');
const path = require('path');
const mammoth = require('mammoth');
// E/F: Added new imports for text extraction and embedding generation
const { extractTextContent } = require('../models/modelFileReader');
const modelEmbedding = require('../models/modelEmbedding');
const modelClustering = require('../models/modelClustering');

exports.renderUploadForm = (req, res) => {
    // Liefere die statische HTML-Datei aus
    res.sendFile(path.join(__dirname, '../../frontend/html/docupload.html'));
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const { originalname, buffer, mimetype } = req.file;
        const { folderId, clusteringParams } = req.body;  // Add clusteringParams to body
        const userId = req.session.userId;

        const folderIdInt = parseInt(folderId, 10);
        const folderIdToUse = isNaN(folderIdInt) ? null : folderIdInt;

        console.log('Extracting text content...');
        const textContent = await extractTextContent(buffer, mimetype, originalname);
        console.log(`Extracted text length: ${textContent.length} characters`);
        
        const embedding = await modelEmbedding.generateEmbedding(textContent);
        const formattedEmbedding = `[${embedding.join(',')}]`;

        // Insert new file
        const query = 'INSERT INTO main.files (user_id, file_name, file_type, file_data, folder_id, embedding) VALUES ($1, $2, $3, $4, $5, $6) RETURNING file_id';
        const values = [userId, originalname, mimetype, buffer, folderIdToUse, formattedEmbedding];

        const result = await db.query(query, values);
        const fileId = result.rows[0].file_id;

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
            minSamples: 3,
            clusterSelectionMethod: 'eom',
            clusterSelectionEpsilon: 0.1
        };

        // Merge default parameters with any provided parameters
        const clusteringConfig = {
            ...defaultParams,
            ...JSON.parse(clusteringParams || '{}')  // Parse provided params or use empty object
        };

        // Run clustering with parameters and debug info
        console.log('Starting clustering process with parameters:', clusteringConfig);
        const clusterLabels = await modelClustering.runClustering(existingEmbeddings, clusteringConfig);
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
                uniqueClusters: [...new Set(clusterLabels)].length,
                assignedCluster: clusterLabels[clusterLabels.length - 1]
            }
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(422).json({ message: 'Error processing file', error: error.message });
    }
};


exports.downloadFile = async (req, res) => {
    try {
        const fileName = req.params.filename;
        const userId = req.session.userId;

        const query = 'SELECT file_data, file_type FROM main.files WHERE file_name = $1 AND user_id = $2';
        const result = await db.query(query, [fileName, userId]);

        if (result.rows.length === 0) {
            return res.status(404).send('File not found');
        }

        const { file_data, file_type } = result.rows[0];

        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
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
        const fileName = req.params.filename;

        const result = await db.query('SELECT file_name, file_type, file_data FROM main.files WHERE file_name = $1', [fileName]);

        //console.log('Reached after query');
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const document = result.rows[0];
        
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
                    <h1>${document.file_name}</h1>
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
                    <h1>${document.file_name}</h1>
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
