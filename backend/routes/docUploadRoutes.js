/**
 * Diese Datei enthält die Routen für den Dokumenten-Upload.
 * Sie ermöglicht das Hochladen, Herunterladen, Anzeigen, Löschen und Verwalten von Dokumentversionen sowie das Abrufen von Ordner-Vorschlägen und keywords.
 *
 * @autor Ilyass,Ayoub. 
 * 
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const docUploadController = require('../controllers/docUploadController');

// Basic routes
router.get('/', docUploadController.renderUploadForm);
router.post('/', upload.single('file'), docUploadController.uploadFile);  // Handles versioning based on filename

// smart file upload mit folder suggestion
router.post('/smart', upload.single('file'), docUploadController.smartUploadFile);

// File operations
router.get('/download/:fileId', docUploadController.downloadFile);
router.get('/view/:fileId', docUploadController.viewFile);
router.delete('/delete/:fileId', docUploadController.deleteFile);

// Version management
router.get('/versions/:fileId', docUploadController.getVersionHistory);
// Endpoint für keywords. routing über App.js wie die alle anderen methoden in diese class :Ayoub 
router.get('/api/keywords-status/:fileId', docUploadController.checkKeywordStatus);

// Folder suggestion routes
router.post('/folder-suggestions', docUploadController.getFolderSuggestions);
router.post('/assign-folder', docUploadController.assignFolder);

module.exports = router;
