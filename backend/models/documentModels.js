/**
 * Diese Datei enthält Funktionen zum Verwalten von Dokumenten.
 * Sie ermöglicht das Umbenennen von Dokumenten in der Datenbank.
 *
 * @author Ilyass
 * 
 */

const File = require('../../database/File.js'); // Sequelize Modell `File`

// Funktion zum Umbenennen eines Dokuments mit Sequelize
const renameDocumentById = async (documentId, newFilename) => {
    try {
        // Update der Datei mit der neuen Datei-Bezeichnung
        const [affectedRows, updatedFiles] = await File.update(
            { file_name: newFilename }, // Neue Datei-Bezeichnung
            {
                where: { file_id: documentId }, // Bedingung: file_id muss übereinstimmen
                returning: true // Gebe die aktualisierten Zeilen zurück
            }
        );

        // Überprüfen, ob eine Datei aktualisiert wurde
        if (affectedRows === 0) {
            throw new Error('Dokument nicht gefunden oder konnte nicht umbenannt werden');
        }

        // Rückgabe der aktualisierten Datei (erste im Array)
        return updatedFiles[0].toJSON();
    } catch (error) {
        console.error('Fehler beim Umbenennen des Dokuments:', error);
        throw error;
    }
};

module.exports = { renameDocumentById };
