const db = require('../../ConnectPostgres');
const path = require('path');
const mammoth = require('mammoth');
const { extractTextContent } = require('../models/modelFileReader');
const modelEmbedding = require('../models/modelEmbedding');

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
        const { folderId } = req.body;
        const userId = req.session.userId;

        const folderIdInt = parseInt(folderId, 10);
        const folderIdToUse = isNaN(folderIdInt) ? null : folderIdInt;

        const textContent = await extractTextContent(buffer, mimetype, originalname);
        const embedding = await modelEmbedding.generateEmbedding(textContent);
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

        res.status(201).json({ message: `File uploaded successfully as version ${version}`, fileId: fileId });
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
        const userId = req.session.userId;

        const query = `
            SELECT file_id, file_name, file_type, file_data, version
            FROM main.files
            WHERE file_name = $1 AND user_id = $2
            ORDER BY version DESC;
        `;
        const result = await db.query(query, [fileName, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const files = result.rows;

        // Respond with JSON containing all versions for the file
        res.json({ versions: files });
    } catch (err) {
        console.error('Error fetching document:', err.stack);
        res.status(500).json({ error: 'Error fetching document', details: err.stack });
    }
};

// New function to get version history based on original_file_id
exports.getVersionHistory = async (req, res) => {
    try {
        const { documentId } = req.params; // Assume documentId is the original file_id
        const userId = req.session.userId;

        const query = `
            SELECT file_id, file_name, file_type, version, created_at
            FROM main.files
            WHERE (file_id = $1 OR original_file_id = $1) AND user_id = $2
            ORDER BY version DESC;
        `;
        const result = await db.query(query, [documentId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No version history found for this document' });
        }

        res.json({ versions: result.rows });
    } catch (error) {
        console.error('Error fetching version history:', error);
        res.status(500).json({ error: 'Error fetching version history' });
    }
};

// New function to download a specific version
exports.downloadVersion = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.session.userId;

        const query = 'SELECT file_data, file_name, file_type FROM main.files WHERE file_id = $1 AND user_id = $2';
        const result = await db.query(query, [fileId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        const { file_data, file_name, file_type } = result.rows[0];
        res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
        res.setHeader('Content-Type', file_type);
        res.send(file_data);
    } catch (error) {
        console.error('Error downloading version:', error);
        res.status(500).json({ message: 'Error downloading version' });
    }
};

// New function to view a specific version
exports.viewVersion = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.session.userId;

        const query = 'SELECT file_data, file_type FROM main.files WHERE file_id = $1 AND user_id = $2';
        const result = await db.query(query, [fileId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        const { file_data, file_type } = result.rows[0];
        res.setHeader('Content-Type', file_type);
        res.send(file_data);
    } catch (error) {
        console.error('Error viewing version:', error);
        res.status(500).json({ message: 'Error viewing version' });
    }
};
