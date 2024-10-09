const db = require('../../ConnectPostgres'); // Importiere den `pg`-Pool

// Funktion, um ein neues Dokument zu erstellen
const createDocument = async (userId, filename, contentType, fileData) => {
    const queryText = `
        INSERT INTO documents (user_id, filename, content_type, file_data)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [userId, filename, contentType, fileData];

    try {
        const result = await db.query(queryText, values);
        return result.rows[0]; // Das erstellte Dokument zurückgeben
    } catch (error) {
        console.error('Fehler beim Erstellen des Dokuments:', error);
        throw error;
    }
};

// Funktion, um ein Dokument nach ID abzurufen
const getDocumentById = async (documentId) => {
    const queryText = `
        SELECT * FROM documents WHERE id = $1;
    `;

    try {
        const result = await db.query(queryText, [documentId]);
        return result.rows[0];
    } catch (error) {
        console.error('Fehler beim Abrufen des Dokuments:', error);
        throw error;
    }
};

// Funktion, um ein Dokument nach ID zu löschen
const deleteDocumentById = async (documentId) => {
    const queryText = `
        DELETE FROM documents WHERE id = $1 RETURNING *;
    `;

    try {
        const result = await db.query(queryText, [documentId]);
        return result.rows[0];
    } catch (error) {
        console.error('Fehler beim Löschen des Dokuments:', error);
        throw error;
    }
};

// Funktion, um alle Dokumente eines bestimmten Nutzers abzurufen
const getDocumentsByUserId = async (userId) => {
    const queryText = `
        SELECT * FROM documents WHERE user_id = $1;
    `;

    try {
        const result = await db.query(queryText, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Fehler beim Abrufen der Dokumente des Nutzers:', error);
        throw error;
    }
};
//rename
const renameDocumentById = async (documentId, newFilename) => {
    const queryText = `
        UPDATE main.files 
        SET file_name = $1 
        WHERE file_id = $2
        RETURNING *;
    `;
    const values = [newFilename, documentId];

    try {
        const result = await db.query(queryText, values);
        return result.rows[0]; // Gibt das umbenannte Dokument zurück
    } catch (error) {
        console.error('Fehler beim Umbenennen des Dokuments:', error);
        throw error;
    }
};
module.exports = {
    createDocument,
    getDocumentById,
    deleteDocumentById,
    getDocumentsByUserId,
    renameDocumentById
};
