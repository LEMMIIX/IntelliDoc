// backend/routes/ocrRoutes.js

const express = require('express');
const multer = require('multer');
const { performOcr } = require('../controllers/OcrController');
const authenticateMiddleware = require('../models/authMiddleware'); // Zum Schutz der Route

const router = express.Router();

// Multer f�r Datei-Uploads einrichten
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OCR Route mit Middleware f�r Authentifizierung und Datei-Upload
router.post('/ocr', authenticateMiddleware, upload.single('image'), performOcr);

module.exports = router;
