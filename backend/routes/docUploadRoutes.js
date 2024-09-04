const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const docUploadController = require('../controllers/docUploadController');

router.get('/', docUploadController.renderUploadForm);
router.post('/', upload.single('file'), docUploadController.uploadFile);
router.get('/download/:filename', docUploadController.downloadFile);
router.get('/view/:filename', docUploadController.viewFile);
router.delete('/delete/:fileId', docUploadController.deleteFile);

module.exports = router;