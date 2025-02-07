/**
 * @fileoverview Diese Datei enthält Funktionen zur Durchführung von OCR auf Bildern.
 * Sie ermöglicht die Vorverarbeitung von Bildern und die Texterkennung mithilfe von Tesseract.js.
 * 
 * @author Ilyass
 * Mithilfe von Tesseract.js und Github-Copilot.
 */

const path = require('path');
const fs = require('fs').promises;
const Tesseract = require('tesseract.js');

let Jimp;
try {
    Jimp = require('jimp');
} catch (error) {
    console.warn('Failed to load Jimp. Falling back to basic image processing.');
}

/**
 * Führt eine Vorverarbeitung des Bildes durch, um die Texterkennung zu verbessern.
 * Falls Jimp nicht verfügbar ist, wird das Originalbild ohne Verarbeitung zurückgegeben.
 * 
 * @async
 * @function preprocessImage
 * @param {Buffer} imageBuffer - Der Bildpuffer, der verarbeitet werden soll.
 * @returns {Promise<Buffer>} Der vorverarbeitete Bildpuffer oder das Originalbild, falls Jimp nicht verfügbar ist.
 * @throws {Error} Falls ein Fehler während der Verarbeitung auftritt.
 * @example
 * const processedImage = await preprocessImage(imageBuffer);
 */
async function preprocessImage(imageBuffer) {
    try {
        if (Jimp && typeof Jimp.read === 'function') {
            const image = await Jimp.read(imageBuffer);
            return image
                .greyscale()
                .contrast(0.1)
                .normalize()
                .getBufferAsync(Jimp.MIME_JPEG);
        } else {
            // Fallback: return the original buffer if Jimp is not available
            console.log('Using original image without preprocessing.');
            return imageBuffer;
        }
    } catch (error) {
        console.error('Error in preprocessImage:', error);
        // Fallback: return the original buffer if preprocessing fails
        return imageBuffer;
    }
}

/**
 * Führt OCR auf einem Bild durch und extrahiert den enthaltenen Text mithilfe von Tesseract.js.
 * 
 * @async
 * @function performOCR
 * @param {Buffer} imageBuffer - Der Bildpuffer, aus dem der Text extrahiert werden soll.
 * @param {string} filename - Der Name der Datei (für Logging-Zwecke).
 * @returns {Promise<{ success: boolean, text?: string, error?: string }>} 
 * Ein Objekt mit dem erkannten Text oder einer Fehlermeldung.
 * @throws {Error} Falls ein Fehler bei der OCR-Erkennung auftritt.
 * @example
 * const result = await performOCR(imageBuffer, 'document.png');
 * if (result.success) {
 *     console.log('Extrahierter Text:', result.text);
 * } else {
 *     console.error('Fehler:', result.error);
 * }
 */
async function performOCR(imageBuffer, filename) {
    console.log('Starting OCR process for:', filename);
    try {
        console.log('Preprocessing image...');
        const processedImageBuffer = await preprocessImage(imageBuffer);

        console.log('Recognizing image...');
        const { data: { text } } = await Tesseract.recognize(processedImageBuffer, 'deu', {
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            tessjs_create_pdf: '0',
            tessjs_create_hocr: '0',
            tessjs_create_tsv: '0',
            preserve_interword_spaces: '1',
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789.,!?()-:;"\' ',
        });

        console.log('OCR completed. Extracted text length:', text.length);

        // Post-process the text
        const processedText = text
            .replace(/[\n\r]+/g, ' ')  // Replace multiple newlines with a single space
            .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
            .trim();                   // Trim leading and trailing whitespace

        console.log(`OCR performed successfully for ${filename}`);
        return { success: true, text: processedText };
    } catch (error) {
        console.error('Error performing OCR:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    performOCR
};
