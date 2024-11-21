// @Autor Luca Neumann
const db = require('../../ConnectPostgres');

// Funktion um Ordnerstruktur auszugeben
exports.getFolderTree = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in' });
    }

    const userId = parseInt(req.session.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const query = `
            WITH RECURSIVE folder_tree AS (
                SELECT folder_id, parent_folder_id, folder_name, 1 AS level
                FROM main.folders
                WHERE user_id = $1 AND parent_folder_id IS NULL
                UNION ALL
                SELECT f.folder_id, f.parent_folder_id, f.folder_name, ft.level + 1
                FROM main.folders f
                JOIN folder_tree ft ON f.parent_folder_id = ft.folder_id
                WHERE f.user_id = $1
            )
            SELECT ft.*, array_agg(files.file_id || ':' || files.file_name) AS files
            FROM folder_tree ft
            LEFT JOIN main.files ON files.folder_id = ft.folder_id
            WHERE files.folder_id IS NOT NULL OR ft.folder_id IS NOT NULL
            GROUP BY ft.folder_id, ft.parent_folder_id, ft.folder_name, ft.level
            ORDER BY ft.level, ft.folder_name;
        `;

        // Abfrage für Datein die in keinem Ordner liegen
        const unassignedFilesQuery = `
            SELECT file_id, file_name
            FROM main.files
            WHERE folder_id IS NULL AND user_id = $1
        `;
        
        const [folderResult, unassignedFilesResult] = await Promise.all([
            db.query(query, [userId]),
            db.query(unassignedFilesQuery, [userId])
        ]);

        // Funktion um die Ordnerstruktur zu erstellen
        const buildTree = (folders, parentId = null) => {
            return folders
                .filter(folder => folder.parent_folder_id === parentId)
                .map(folder => ({
                    id: folder.folder_id,
                    name: folder.folder_name,
                    files: folder.files[0] ? folder.files.map(file => {
                        const [id, name] = file.split(':');
                        return { id, name };
                    }) : [],
                    children: buildTree(folders, folder.folder_id)
                }));
        };

        const folderTree = buildTree(folderResult.rows);

        // Dateien ohne Ordner hinzufügen
        const unassignedFiles = unassignedFilesResult.rows.map(file => ({
            id: file.file_id,
            name: file.file_name
        }));

        res.json({ folderTree, unassignedFiles });
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: 'Error fetching folders' });
    }
};



// Funktion zum Erstellen eines neuen Ordners
const { generateEmbedding } = require('../models/modelEmbedding'); // Importiere die Funktion zum Generieren von Embeddings

exports.createFolder = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in' });
    }

    const userId = parseInt(req.session.userId, 10);
    const { folderName, parentFolderId } = req.body;

    if (!folderName) {
        return res.status(400).json({ message: 'Folder name is required' });
    }

    try {
        // Falls parentFolderId nicht angegeben oder ungültig ist, auf NULL setzen
        const parentFolderIdToUse = parentFolderId ? parseInt(parentFolderId, 10) : null;

        // Generiere das Embedding für den Ordnernamen
        const embedding = await generateEmbedding(folderName);

        // Embedding für Postgres Syntax formatieren
        const formattedEmbedding = `[${embedding.join(',')}]`;

        // SQL-Query zum Erstellen des neuen Ordners
        const query = `
            INSERT INTO main.folders (user_id, folder_name, parent_folder_id, embedding) 
            VALUES ($1, $2, $3, $4) RETURNING folder_id
        `;
        const values = [userId, folderName, parentFolderIdToUse, formattedEmbedding];

        const result = await db.query(query, values);

        res.status(201).json({ message: 'Folder created successfully', folderId: result.rows[0].folder_id });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Error creating folder' });
    }
};

// Funktion zum Abrufen aller Ordner des Benutzers
exports.getFolders = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in' });
    }

    const userId = parseInt(req.session.userId, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const query = `
            SELECT folder_id, folder_name
            FROM main.folders
            WHERE user_id = $1 
        `;
        const result = await db.query(query, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ message: 'Error fetching folders' });
    }
};

// Funktion zum Löschen eines Ordners und seiner Unterordner inklusive der enthaltenen Datein
exports.deleteFolder = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in' });
    }

    const userId = parseInt(req.session.userId, 10);
    const { folderId } = req.params; // Ordner-ID wird als Parameter erwartet

    if (isNaN(userId) || isNaN(folderId)) {
        return res.status(400).json({ message: 'Invalid user ID or folder ID' });
    }

    try {
        // Überprüfen, ob der Ordner existiert und dem Benutzer gehört
        const checkQuery = `
            SELECT folder_id FROM main.folders 
            WHERE folder_id = $1 AND user_id = $2
        `;
        const checkResult = await db.query(checkQuery, [folderId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Folder not found or not authorized' });
        }

        // Rekursiv alle Unterordner des Ordners finden und die Datein darin löschen
        const recursiveDeleteFilesQuery = `
            WITH RECURSIVE subfolders AS (
                SELECT folder_id FROM main.folders WHERE folder_id = $1
                UNION
                SELECT f.folder_id
                FROM main.folders f
                INNER JOIN subfolders sf ON f.parent_folder_id = sf.folder_id
            )
            DELETE FROM main.files WHERE folder_id IN (SELECT folder_id FROM subfolders);
        `;

        // Löschen der Dateien in allen Unterordnern
        await db.query(recursiveDeleteFilesQuery, [folderId]);

        // Rekursiv alle Unterordner des Ordners löschen
        const recursiveDeleteFoldersQuery = `
            WITH RECURSIVE subfolders AS (
                SELECT folder_id FROM main.folders WHERE folder_id = $1
                UNION
                SELECT f.folder_id
                FROM main.folders f
                INNER JOIN subfolders sf ON f.parent_folder_id = sf.folder_id
            )
            DELETE FROM main.folders WHERE folder_id IN (SELECT folder_id FROM subfolders);
        `;

        // Löschen der Unterordner
        await db.query(recursiveDeleteFoldersQuery, [folderId]);

        res.status(200).json({ message: 'Folder and its subfolders deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder and its subfolders:', error);
        res.status(500).json({ message: 'Error deleting folder and its subfolders' });
    }
};

// Funktion zum Umbenennen eines Ordners
exports.renameFolder = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in' });
    }

    const userId = parseInt(req.session.userId, 10);
    const { folderId, newFolderName } = req.body;

    // Validierung der Eingabedaten
    if (!folderId || !newFolderName) {
        return res.status(400).json({ message: 'Ordner-ID und neuer Ordnername sind erforderlich.' });
    }

    try {
        // Überprüfen, ob der Ordner existiert und dem Nutzer gehört
        const checkQuery = `
            SELECT folder_id FROM main.folders 
            WHERE folder_id = $1 AND user_id = $2
        `;
        const checkResult = await db.query(checkQuery, [folderId, userId]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Ordner nicht gefunden oder nicht autorisiert.' });
        }

        // Ordnernamen in der Datenbank aktualisieren
        const updateQuery = `
            UPDATE main.folders 
            SET folder_name = $1 
            WHERE folder_id = $2 
            RETURNING *;
        `;
        const updateResult = await db.query(updateQuery, [newFolderName, folderId]);

        // Erfolgreiche Rückmeldung an den Client
        res.json({ message: 'Ordner erfolgreich umbenannt.', folder: updateResult.rows[0] });
    } catch (error) {
        console.error('Fehler beim Umbenennen des Ordners:', error);
        res.status(500).json({ message: 'Fehler beim Umbenennen des Ordners.' });
    }
};
