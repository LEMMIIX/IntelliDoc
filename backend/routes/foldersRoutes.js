/**
 * @fileoverview Diese Datei enthält die Routen für die Verwaltung von Ordnern.
 * Sie ermöglicht das Erstellen, Löschen, Umbenennen und Abrufen von Ordnern sowie das Umbenennen von Dokumenten.
 * 
 * @module foldersRoutes
 * @author Luca, Ilyass
 */

const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');
const { renameDocumentById } = require('../models/documentModels');

/**
 * Ruft die komplette Ordnerstruktur des Benutzers ab.
 * 
 * @async
 * @function
 * @route GET /tree
 * @param {Object} req - Das Request-Objekt mit der Benutzersitzung.
 * @param {Object} res - Das Response-Objekt mit der hierarchischen Ordnerstruktur.
 * @returns {Promise<void>} Antwort mit der Ordnerstruktur.
 * @throws {Error} Falls ein Fehler beim Abrufen auftritt.
 */
router.get('/tree', foldersController.getFolderTree); //Route zum Ausgaben der Ordnerstruktur

/**
 * Erstellt einen neuen Ordner für den Benutzer.
 * 
 * @async
 * @function
 * @route POST /create
 * @param {Object} req - Das Request-Objekt mit dem Ordnernamen und optional der Parent-Folder-ID.
 * @param {string} req.body.folderName - Der Name des neuen Ordners.
 * @param {string} [req.body.parentFolderId] - Die ID des übergeordneten Ordners (optional).
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit der ID des neu erstellten Ordners.
 * @throws {Error} Falls die Erstellung fehlschlägt.
 */
router.post('/create', foldersController.createFolder); //Route zum erstellen eines Ordners

/**
 * Ruft alle Ordner des Benutzers ab.
 * 
 * @async
 * @function
 * @route GET /
 * @param {Object} req - Das Request-Objekt mit der Benutzersitzung.
 * @param {Object} res - Das Response-Objekt mit einer Liste der Ordner.
 * @returns {Promise<void>} Antwort mit einer JSON-Liste der Ordner.
 * @throws {Error} Falls das Abrufen der Ordner fehlschlägt.
 */
router.get('/', foldersController.getFolders); //Route zum Ausgeben aller Ordner des Benutzers

/**
 * Löscht einen Ordner anhand seiner ID.
 * 
 * @async
 * @function
 * @route DELETE /:folderId
 * @param {Object} req - Das Request-Objekt mit der Ordner-ID.
 * @param {string} req.params.folderId - Die ID des zu löschenden Ordners.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit einer Bestätigung des Löschvorgangs.
 * @throws {Error} Falls der Ordner nicht gefunden wird oder ein Fehler auftritt.
 */
router.delete('/:folderId', foldersController.deleteFolder); // Route zum Löschen eines Ordners

/**
 * Ändert den Namen eines vorhandenen Ordners.
 * 
 * @async
 * @function
 * @route POST /renameFolder
 * @param {Object} req - Das Request-Objekt mit der Ordner-ID und dem neuen Namen.
 * @param {string} req.body.folderId - Die ID des umzubenennenden Ordners.
 * @param {string} req.body.newFolderName - Der neue Name des Ordners.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit einer Bestätigung der Umbenennung.
 * @throws {Error} Falls der Ordner nicht gefunden wird oder ein Fehler auftritt.
 */
router.post('/renameFolder', foldersController.renameFolder); // Route zum Umbenennen eines Ordners




/**
 * Ändert den Namen eines Dokuments anhand seiner ID.
 * 
 * @async
 * @function
 * @route POST /rename
 * @param {Object} req - Das Request-Objekt mit der Dokument-ID und dem neuen Namen.
 * @param {string} req.body.documentId - Die ID des umzubenennenden Dokuments.
 * @param {string} req.body.newFilename - Der neue Name des Dokuments.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit einer Bestätigung der Umbenennung.
 * @throws {Error} Falls das Dokument nicht gefunden wird oder ein Fehler auftritt.
 */
router.post('/rename', async (req, res) => {
    const { documentId, newFilename } = req.body;
    console.log("cc", req.body)
    // Prüfen, ob die benötigten Daten übergeben wurden
    if (!documentId || !newFilename) {
        return res.status(400).json({ message: 'Dokument-ID und neuer Dateiname sind erforderlich' });
    }

    // Loggen, welche Operation ausgeführt wird, zur besseren Nachverfolgung
    //console.log(`Umbenennen des Dokuments mit ID ${documentId} in ${newFilename}`);

    try {
        // Benutze die Funktion, um das Dokument umzubenennen
        const updatedDocument = await renameDocumentById(documentId, newFilename);

        // Prüfen, ob das Dokument tatsächlich existiert und umbenannt wurde
        if (!updatedDocument) {
            return res.status(404).json({ message: 'Dokument nicht gefunden' });
        }

        // Erfolgsmeldung senden, jetzt als JSON
        res.json({ message: 'Dokument erfolgreich umbenannt' });
    } catch (error) {
        // Fehlerbehandlung und Loggen von Fehlern
        console.error(`Fehler beim Umbenennen des Dokuments: ${error}`);
        res.status(500).json({ message: 'Fehler beim Umbenennen des Dokuments' });
    }
});

module.exports = router;