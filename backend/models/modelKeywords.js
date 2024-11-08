const { PythonShell } = require('python-shell');
const path = require('path');

// Pfad zum Python-Skript, das die Schlagwort-Generierung durchführt
const keywordGeneratorPath = path.join(__dirname, 'keyBert.py');

// Funktion zur Schlagwörter-Generierung
async function generateKeywords(text) {
    console.log('Sending text to Python:', text);
    return new Promise((resolve, reject) => {
        const pyshell = new PythonShell(keywordGeneratorPath, { mode: 'text' });

        // Sende den Text an das Python-Skript
        pyshell.send(text);

        let keywords = [];

        // Empfange die Schlagwörter von Python
        pyshell.on('message', function (message) {
            
            const receivedKeywords = JSON.parse(message);  
            keywords = receivedKeywords;
        });

        // Beende den Prozess und gib das Ergebnis zurück
        pyshell.end(function (err) {
            if (err) {
                console.error('Fehler bei der Schlagwort-Generierung:', err);
                return reject(err);
            }
            resolve(keywords); // Die Schlagwörter werden hier zurückgegeben
        });
    });
}

module.exports = { generateKeywords };


//Ayoub