const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const docUploadController = require('../controllers/docUploadController');

// Basic routes
router.get('/', docUploadController.renderUploadForm);
router.post('/', upload.single('file'), docUploadController.uploadFile);  // Handles versioning based on filename

// File operations - all using fileId
router.get('/download/:fileId', docUploadController.downloadFile);
router.get('/view/:fileId', docUploadController.viewFile);
router.delete('/delete/:fileId', docUploadController.deleteFile);

// Get version history for a file
router.get('/versions/:fileId', docUploadController.getVersionHistory);
// Get keywords for a file
router.get('/keywords/:fileId', docUploadController.getKeywords);

module.exports = router;