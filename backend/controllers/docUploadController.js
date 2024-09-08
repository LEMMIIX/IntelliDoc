const db = require('../../ConnectPostgres');
const path = require('path');
const mammoth = require('mammoth');
const { performOCR } = require('../models/modelOcr');

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
        const { folderId } = req.body;
        const userId = req.session.userId;

        // Konvertiere folderId in eine Ganzzahl, wenn möglich
        const folderIdInt = parseInt(folderId, 10);
        // Falls folderId leer ist oder keine gültige Zahl ist, auf NULL setzen
        const folderIdToUse = isNaN(folderIdInt) ? null : folderIdInt;

        // Überprüfe die Werte für Debugging-Zwecke
        console.log('File Name:', originalname); // Ändere filename zu originalname
        console.log('File Type:', mimetype);
        console.log('File Buffer:', buffer);
        console.log('Folder ID:', folderIdToUse);

        // SQL-Query zum Einfügen der Datei
        const query = 'INSERT INTO main.files (user_id, file_name, file_type, file_data, folder_id) VALUES ($1, $2, $3, $4, $5) RETURNING file_id';
        const values = [userId, originalname, mimetype, buffer, folderIdToUse]; // Verwende originalname statt filename

        const result = await db.query(query, values);
        const fileId = result.rows[0].file_id;

        console.log('File uploaded to database. File ID:', fileId);

        if (mimetype === 'image/png' || mimetype === 'image/jpeg') {
            console.log('Image file detected. Starting OCR process...');
            const ocrResult = await performOCR(buffer, originalname);
            console.log('OCR Result:', ocrResult.success ? 'Success' : 'Failed', ocrResult);
        } else {
            console.log('Not an image file. Skipping OCR.');
        }

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

exports.viewFile = async (req, res) => {
    try {
        const fileName = req.params.filename;

        const result = await db.query('SELECT file_name, file_type, file_data FROM main.files WHERE file_name = $1', [fileName]);

        console.log('Reached after query');
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
                        }
                    </style>
                </head>
                <body>
                    <h1>${document.file_name}</h1>
                    <div class="file-content">${document.file_data.toString()}</div>
                </body>
                </html>
            `);
        } else if (document.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Use mammoth to convert the DOCX file_data buffer to HTML
            const docxBuffer = Buffer.from(document.file_data);
            const { value: htmlContent } = await mammoth.convertToHtml({ buffer: docxBuffer });
            
            // Send the generated HTML content
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