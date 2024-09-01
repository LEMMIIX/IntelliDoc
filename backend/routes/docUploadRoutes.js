const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const docUploadController = require('../controllers/docUploadController');

router.get('/', docUploadController.renderUploadForm);
router.post('/', upload.single('file'), docUploadController.uploadFile);

module.exports = router;