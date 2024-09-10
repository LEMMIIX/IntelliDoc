const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { performOCR } = require('./modelOcr');

/* Datei ist zuständih dafür die Dateien auszuölesen und den Inhalt zu liefern. */

async function extractTextContent(buffer, mimetype, filename) {
    let textContent = '';

    switch (mimetype) {
        case 'application/pdf':
            const pdfData = await pdfParse(buffer);
            textContent = pdfData.text;
            break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            const result = await mammoth.extractRawText({ buffer });
            textContent = result.value;
            break;
        case 'text/plain':
            textContent = buffer.toString('utf-8');
            break;
        case 'image/png':
        case 'image/jpeg':
            const ocrResult = await performOCR(buffer, filename);
            textContent = ocrResult.text;
            break;
        default:
            throw new Error('Unsupported file type');
    }

    return textContent;
}

module.exports = {
    extractTextContent
};