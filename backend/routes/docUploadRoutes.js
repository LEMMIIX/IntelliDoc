/**
 * @fileoverview Diese Datei enthält die Routen für den Dokumenten-Upload.
 * Sie ermöglicht das Hochladen, Herunterladen, Anzeigen, Löschen und Verwalten von Dokumentversionen 
 * sowie das Abrufen von Ordner-Vorschlägen und Keywords.
 * 
 * @module docUploadRoutes
 * @author Ilyass, Ayoub
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const docUploadController = require('../controllers/docUploadController');

/**
 * Zeigt das Upload-Formular für Dokumente an.
 * 
 * @function
 * @route GET /
 * @param {Object} req - Das Request-Objekt.
 * @param {Object} res - Das Response-Objekt.
 */
router.get('/', docUploadController.renderUploadForm);

/**
 * Lädt eine Datei hoch und verarbeitet sie. Handhabt die Versionierung basierend auf dem Dateinamen.
 * 
 * @async
 * @function
 * @route POST /
 * @param {Object} req - Das Request-Objekt mit der Datei im `file`-Feld.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit Datei-Upload-Details.
 * @throws {Error} Falls der Upload oder die Verarbeitung fehlschlägt.
 */
router.post('/', upload.single('file'), docUploadController.uploadFile);  // Handles versioning based on filename

/**
 * Führt den "Smart Upload" durch, analysiert das Dokument und schlägt passende Ordner vor.
 * 
 * @async
 * @function
 * @route POST /smart
 * @param {Object} req - Das Request-Objekt mit der hochgeladenen Datei.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit Ordner-Vorschlägen.
 * @throws {Error} Falls die Analyse oder der Upload fehlschlägt.
 */
router.post('/smart', upload.single('file'), docUploadController.smartUploadFile);

/**
 * Ermöglicht das Herunterladen einer Datei anhand ihrer ID.
 * 
 * @async
 * @function
 * @route GET /download/:fileId
 * @param {Object} req - Das Request-Objekt mit der Datei-ID in `params.fileId`.
 * @param {Object} res - Das Response-Objekt.
 * @throws {Error} Falls die Datei nicht gefunden wird oder ein Download-Fehler auftritt.
 */
router.get('/download/:fileId', docUploadController.downloadFile);

/**
 * Zeigt eine Datei im Browser an, falls sie ein unterstütztes Format hat.
 * 
 * @async
 * @function
 * @route GET /view/:fileId
 * @param {Object} req - Das Request-Objekt mit der Datei-ID in `params.fileId`.
 * @param {Object} res - Das Response-Objekt.
 * @throws {Error} Falls die Datei nicht gefunden wird oder ein Anzeige-Fehler auftritt.
 */
router.get('/view/:fileId', docUploadController.viewFile);

/**
 * Löscht eine Datei anhand ihrer ID.
 * 
 * @async
 * @function
 * @route DELETE /delete/:fileId
 * @param {Object} req - Das Request-Objekt mit der Datei-ID in `params.fileId`.
 * @param {Object} res - Das Response-Objekt.
 * @throws {Error} Falls die Datei nicht gefunden wird oder ein Löschfehler auftritt.
 */
router.delete('/delete/:fileId', docUploadController.deleteFile);

/**
 * Ruft die komplette Versionshistorie einer Datei ab.
 * 
 * @async
 * @function
 * @route GET /versions/:fileId
 * @param {Object} req - Das Request-Objekt mit der Datei-ID in `params.fileId`.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit allen Versionen der Datei.
 * @throws {Error} Falls die Datei nicht gefunden wird oder ein Fehler auftritt.
 */
router.get('/versions/:fileId', docUploadController.getVersionHistory);

/**
 * Überprüft, ob für eine Datei bereits Schlüsselwörter generiert wurden.
 * 
 * @async
 * @function
 * @route GET /api/keywords-status/:fileId
 * @param {Object} req - Das Request-Objekt mit der Datei-ID in `params.fileId`.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit dem Status der Keyword-Generierung.
 */
router.get('/api/keywords-status/:fileId', docUploadController.checkKeywordStatus);

/**
 * Gibt Vorschläge für passende Ordner basierend auf dem hochgeladenen Dokument zurück.
 * 
 * @async
 * @function
 * @route POST /folder-suggestions
 * @param {Object} req - Das Request-Objekt mit Text- und Embedding-Daten.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Antwort mit empfohlenen Ordnern.
 * @throws {Error} Falls ein Fehler bei der Berechnung auftritt.
 */
router.post('/folder-suggestions', docUploadController.getFolderSuggestions);

/**
 * Weist einer Datei einen passenden Ordner zu.
 * 
 * @async
 * @function
 * @route POST /assign-folder
 * @param {Object} req - Das Request-Objekt mit Datei- und Ordner-ID.
 * @param {Object} res - Das Response-Objekt.
 * @returns {Promise<void>} Bestätigung der Ordnerzuweisung.
 * @throws {Error} Falls die Datei nicht gefunden wird oder ein Fehler auftritt.
 */
router.post('/assign-folder', docUploadController.assignFolder);

module.exports = router;
