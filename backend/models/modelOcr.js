const path = require('path');
const fs = require('fs').promises;
const Tesseract = require('tesseract.js');

let Jimp;
try {
    Jimp = require('jimp');
} catch (error) {
    console.warn('Failed to load Jimp. Falling back to basic image processing.');
}

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
