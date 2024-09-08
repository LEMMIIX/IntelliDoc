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

        // Diese JSON Struktur is nötig damit Llama 3 den Inhalt korrekt ausliest und embedden kann
        const llamaJsonResult = {
            input: [
                {
                    text: text
                }
            ],
            model: "llama3",        // halt der Model Name, evtl anpssen je nachdem wie exakt man L3 anspricht
            task_type: "embedding"  // die Aufgabe den Text zu vektorisieren
        };

        console.log('Ensuring OCR results folder exists:', OCR_RESULTS_FOLDER);
        await fs.ensureDir(OCR_RESULTS_FOLDER);

        const jsonFilename = path.join(OCR_RESULTS_FOLDER, `${path.parse(filename).name}_llama3.json`);
        console.log('Writing JSON file:', jsonFilename);
        await fs.writeJson(jsonFilename, llamaJsonResult, { spaces: 2 });

        console.log(`OCR performed successfully for ${filename}. Llama 3 JSON saved at: ${jsonFilename}`);
        return { success: true, jsonPath: jsonFilename, metadataPath: metadataFilename };
    } catch (error) {
        console.error('Error performing OCR:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    performOCR
};