const db = require('../../ConnectPostgres');
const { check, validationResult } = require('express-validator');
const path = require('path');

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { filename, mimetype, buffer } = req.file;
        const { folderId } = req.body;
        const userId = req.session.userId;

        // Validate folderId
        if (folderId) {
            const folderQuery = 'SELECT folder_id FROM main.folders WHERE folder_id = $1 AND user_id = $2';
            const folderResult = await db.query(folderQuery, [folderId, userId]);
            if (folderResult.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid folder selected' });
            }
        }

        // Insert file into database
        const query = `
            INSERT INTO main.files (user_id, file_name, file_type, file_data, folder_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING file_id
        `;
        const values = [userId, filename, mimetype, buffer, folderId || null];

        const result = await db.query(query, values);
        const fileId = result.rows[0].file_id;

        // Respond with success message and file details
        res.status(201).json({
            message: 'File uploaded successfully',
            fileId: fileId,
            fileName: filename,
            fileType: mimetype,
            folderId: folderId || 'root'
        });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

exports.renderUploadForm = async (req, res) => {
    try {
        const userId = req.session.userId;
        const foldersQuery = 'SELECT folder_id, folder_name FROM main.folders WHERE user_id = $1';
        const folders = await db.query(foldersQuery, [userId]);
        res.sendFile(path.join(__dirname, '../../frontend/html/docupload.html'));
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).send('Error fetching folders');
    }
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { filename, mimetype, buffer } = req.file;
        const { folderId } = req.body;
        const userId = req.session.userId;
        
        const query = 'INSERT INTO main.files (user_id, file_name, file_type, file_data, folder_id) VALUES ($1, $2, $3, $4, $5) RETURNING file_id';
        const values = [userId, filename, mimetype, buffer, folderId || null];
        
        const result = await db.query(query, values);
        res.status(201).json({ message: 'File uploaded successfully', fileId: result.rows[0].file_id });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
};

exports.downloadFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const query = 'SELECT file_data, file_type FROM main.files WHERE file_name = $1 AND user_id = $2';
        const result = await db.query(query, [filename, req.session.userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('File not found');
        }
        
        const { file_data, file_type } = result.rows[0];
        res.setHeader('Content-Type', file_type);
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(file_data);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
};

exports.viewFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const query = 'SELECT file_data, file_type FROM main.files WHERE file_name = $1 AND user_id = $2';
        const result = await db.query(query, [filename, req.session.userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).send('File not found');
        }
        
        const { file_data, file_type } = result.rows[0];
        res.setHeader('Content-Type', file_type);
        res.send(file_data);
    } catch (error) {
        console.error('Error viewing file:', error);
        res.status(500).send('Error viewing file');
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const { fileid } = req.params;
        const query = 'DELETE FROM main.files WHERE file_id = $1 AND user_id = $2';
        await db.query(query, [fileid, req.session.userId]);
        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).send('Error deleting file');
    }
};