const path = require('path');
const fs = require('fs-extra');
const Tesseract = require('tesseract.js');

const OCR_RESULTS_FOLDER = path.join(__dirname, '../../ocr_results');

async function performOCR(imageBuffer, filename) {
    console.log('Starting OCR process for:', filename);
    try {
        console.log('Recognizing image...');
        const { data: { text } } = await Tesseract.recognize(imageBuffer);
        
        console.log('OCR completed. Extracted text length:', text.length);

        const jsonResult = { 
            filename: filename,
            extractedText: text,
            timestamp: new Date().toISOString()
        };

        console.log('Ensuring OCR results folder exists:', OCR_RESULTS_FOLDER);
        await fs.ensureDir(OCR_RESULTS_FOLDER);

        const jsonFilename = path.join(OCR_RESULTS_FOLDER, `${path.parse(filename).name}.json`);
        console.log('Writing JSON file:', jsonFilename);
        await fs.writeJson(jsonFilename, jsonResult, { spaces: 2 });

        console.log(`OCR performed successfully for ${filename}. JSON saved at: ${jsonFilename}`);
        return { success: true, jsonPath: jsonFilename };
    } catch (error) {
        console.error('Error performing OCR:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    performOCR
};