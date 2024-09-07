// Handle the "Choose File" button click
document.getElementById('chooseFileButton').addEventListener('click', function () {
    document.getElementById('ocrInput').click();
});

// Enable the OCR button only after a file is selected
document.getElementById('ocrInput').addEventListener('change', function () {
    document.getElementById('readOcrButton').disabled = false;
});

// Handle the "Read OCR" button click
document.getElementById('readOcrButton').addEventListener('click', function () {
    const formData = new FormData(document.getElementById('ocrForm'));
    fetch('/ocr', { // Korrekte URL für den Endpunkt
        method: 'POST',
        body: formData
    })
        .then(response => response.json()) // Erwartet JSON-Antwort vom Server
        .then(data => {
            alert(data.message); // Erfolgsmeldung anzeigen
            document.getElementById('ocrResult').innerText = "OCR Ergebnis: " + (data.text || 'Kein Text erkannt'); // OCR-Ergebnis anzeigen
        })
        .catch(error => {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
        });
});
