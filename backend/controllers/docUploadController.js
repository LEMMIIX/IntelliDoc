const db = require('../../ConnectPostgres');

exports.renderUploadForm = async (req, res) => {
    try {
        const userId = req.session.userId;
        const foldersQuery = 'SELECT folder_id, folder_name FROM main.folders WHERE user_id = $1';
        const folders = await db.query(foldersQuery, [userId]);
        res.render('docupload', { folders: folders.rows });
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).send('Error fetching folders');
    }
};

exports.uploadFile = async (req, res) => {
    try {
        const { filename, mimetype } = req.file;
        const { folderId } = req.body;
        const userId = req.session.userId;
        
        const query = 'INSERT INTO main.files (user_id, file_name, file_type, file_data, folder_id) VALUES ($1, $2, $3, $4, $5) RETURNING file_id';
        const values = [userId, filename, mimetype, req.file.buffer, folderId];
        
        const result = await db.query(query, values);
        res.status(201).json({ message: 'File uploaded successfully', fileId: result.rows[0].file_id });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
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