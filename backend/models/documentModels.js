const db = require('../../ConnectPostgres'); // Importiere den `pg`-Pool
const embeddingService = require('./modelEmbedding');

// Funktion, um ein neues Dokument zu erstellen
const createDocument = async (userId, filename, contentType, fileData, textContent) => {
    const embedding = await embeddingService.generateEmbedding(textContent);            // ruft das Embedding auf

    const queryText = `
        INSERT INTO documents (user_id, filename, content_type, file_data, embedding)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [userId, filename, contentType, fileData, embedding];

    try {
        const result = await db.query(queryText, values);
        return result.rows[0]; // Das erstellte Dokument zur�ckgeben
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

// Funktion, um ein Dokument nach ID zu l�schen
const deleteDocumentById = async (documentId) => {
    const queryText = `
        DELETE FROM documents WHERE id = $1 RETURNING *;
    `;

    try {
        const result = await db.query(queryText, [documentId]);
        return result.rows[0];
    } catch (error) {
        console.error('Fehler beim L�schen des Dokuments:', error);
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

module.exports = {
    createDocument,
    getDocumentById,
    deleteDocumentById,
    getDocumentsByUserId
};
