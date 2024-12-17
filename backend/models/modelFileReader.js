/**
 * Diese Datei enthält Funktionen zum Extrahieren von Textinhalten aus verschiedenen Dateiformaten.
 * Sie unterstützt PDF, DOCX, Textdateien und Bilder (mittels OCR).
 *
 * @author Miray
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

const { PythonShell } = require('python-shell');
const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const { performOCR } = require('./modelOcr');
const { performance } = require('perf_hooks');

const pythonScriptPath = path.join(__dirname, 'pdf_extractor.py');

async function extractTextFromPDF(buffer) {
    const maxRetries = 3;
    const retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            //console.log(`Attempt ${attempt} to extract text from PDF`);
            const pyshell = new PythonShell(pythonScriptPath, {
                mode: 'text',
                pythonOptions: ['-u'],
                stdinWithAck: true,
                encoding: 'utf-8'
            });

            const extractedText = await new Promise((resolve, reject) => {
                let textContent = '';
                pyshell.stdin.write(buffer.toString('base64'));
                pyshell.stdin.end();

                pyshell.on('message', (message) => {
                    textContent += message;
                });

                pyshell.end((err) => {
                    if (err) {
                        console.error(`Attempt ${attempt} failed:`, err);
                        reject(err);
                    } else {
                        resolve(textContent);
                    }
                });
            });

            if (extractedText.startsWith('ERROR:')) {
                throw new Error(extractedText);
            }

            return extractedText;
        } catch (error) {
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

async function extractTextFromDOCX(buffer) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
}

const extractors = {
    'application/pdf': extractTextFromPDF,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractTextFromDOCX,
    'text/plain': (buffer) => buffer.toString('utf-8'),
    'image/png': performOCR,
    'image/jpeg': performOCR
};

async function extractTextContent(buffer, mimetype, filename) {
    const startTime = performance.now();
    
    console.log(`Processing file: ${filename} (${mimetype})`);

    const extractor = extractors[mimetype];
    if (!extractor) {
        throw new Error('Unsupported file type');
    }

    let textContent;
    if (mimetype.startsWith('image/')) {
        const result = await extractor(buffer, filename);
        if (result.success) {
            textContent = result.text;
        } else {
            throw new Error(`OCR failed: ${result.error}`);
        }
    } else {
        textContent = await extractor(buffer, filename);
    }

    if (typeof textContent !== 'string') {
        throw new Error(`Unexpected result type from extractor: ${typeof textContent}`);
    }

    console.log(`Successfully extracted text from ${filename}`);
    console.log(`Preview of extracted text (first 1000 characters):`);
    console.log(textContent.substring(0, 1000));
    //console.log(`... (${textContent.length} total characters extracted)`);

    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    console.log(`Reading file time: ${processingTime} ms`);

    return textContent;
}

module.exports = { extractTextContent };