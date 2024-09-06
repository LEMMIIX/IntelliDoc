// backend/controllers/OcrController.js

const tesseract = require('tesseract.js');
const sharp = require('sharp');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const { Document } = require('../models/documentModels'); // Importiere das Document-Modell

const performOcr = async (req, res) => {
    try {
        console.log('OCR process started...');

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const originalNameWithoutExt = path.parse(req.file.originalname).name; // Ursprünglicher Dateiname ohne Erweiterung
        const buffer = req.file.buffer;

        // OCR durchführen
        console.log('Performing OCR on uploaded image...');
        const { data: { text } } = await tesseract.recognize(buffer, 'eng', {
            logger: m => console.log(m),
        });
        console.log('OCR completed. Extracted text:', text);

        // PDF-Dokument erstellen
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const fontSize = 12;
        const textWidth = page.getWidth() - 40;
        const textHeight = page.getHeight() - 40;
        const lines = text.split('\n');
        let y = textHeight + 20;
        const lineHeight = fontSize * 1.2;

        lines.forEach((line) => {
            y -= lineHeight;
            page.drawText(line, {
                x: 20,
                y: y,
                size: fontSize,
                color: rgb(0, 0, 0),
            });
        });

        // PDF-Datei speichern
        const pdfBytes = await pdfDoc.save();

        // PNG-Version des Originalbilds erstellen
        console.log('Creating PNG version of the image...');
        const pngBuffer = await sharp(buffer).png().toBuffer();

        // Benutzer-ID aus der Session holen
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: No user session found' });
        }

        // PDF in PostgreSQL speichern
        console.log('Saving PDF to database...');
        const pdfDocument = await Document.create({
            userId: userId,
            filename: `${originalNameWithoutExt}.pdf`,
            contentType: 'application/pdf',
            fileData: pdfBytes // Als BLOB speichern
        });

        // PNG in PostgreSQL speichern
        console.log('Saving PNG to database...');
        const pngDocument = await Document.create({
            userId: userId,
            filename: `${originalNameWithoutExt}.png`,
            contentType: 'image/png',
            fileData: pngBuffer // Als BLOB speichern
        });

        // Antwort an den Benutzer zurückgeben
        console.log('OCR process completed successfully.');
        res.json({
            message: 'OCR erfolgreich abgeschlossen und Dateien gespeichert',
            pdfDocument,
            pngDocument,
            text // OCR-Ergebnis zurückgeben
        });
    } catch (err) {
        console.error(`Fehler bei der Verarbeitung des Bildes: ${err}`);
        res.status(500).json({ message: 'Fehler bei der Verarbeitung des Bildes', error: err.message });
    }
};

module.exports = { performOcr };
