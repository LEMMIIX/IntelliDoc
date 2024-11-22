const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const docUploadController = require('../controllers/docUploadController');

// Basic routes
router.get('/', docUploadController.renderUploadForm);
router.post('/', upload.single('file'), docUploadController.uploadFile);

// smart file upload with folder suggestion
router.post('/smart', upload.single('file'), docUploadController.smartUploadFile);

// File operations
router.get('/download/:fileId', docUploadController.downloadFile);
router.get('/view/:fileId', docUploadController.viewFile);
router.delete('/delete/:fileId', docUploadController.deleteFile);

// Version management
router.get('/versions/:fileId', docUploadController.getVersionHistory);

// Folder suggestion routes
router.post('/folder-suggestions', docUploadController.getFolderSuggestions);
router.post('/assign-folder', docUploadController.assignFolder);

module.exports = router;