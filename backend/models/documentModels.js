/**
 * @fileoverview Enthält Funktionen zur Verwaltung von Dokumenten.
 * Diese Datei ermöglicht das Umbenennen von Dokumenten in der Datenbank.
 * 
 * @author Ilyass
 * @module documentModels
 */

const File = require('../../database/File.js'); // Sequelize Modell `File`

/**
 * Benennt ein Dokument in der Datenbank um.
 *
 * @async
 * @function renameDocumentById
 * @param {number} documentId - Die ID des zu umbenennenden Dokuments.
 * @param {string} newFilename - Der neue Dateiname für das Dokument.
 * @returns {Promise<Object>} Das aktualisierte Dokument als JSON-Objekt.
 * @throws {Error} Wenn das Dokument nicht gefunden oder nicht umbenannt werden konnte.
 * @example
 * const updatedDoc = await renameDocumentById(123, "newfile.txt");
 * console.log(updatedDoc);
 */
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
