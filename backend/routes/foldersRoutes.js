// @Autor Luca Neumann
const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');
const { renameDocumentById } = require('../models/documentModels');

router.get('/tree', foldersController.getFolderTree); //Route zum Ausgaben der Ordnerstruktur
router.post('/create', foldersController.createFolder); //Route zum erstellen eines Ordners
router.get('/', foldersController.getFolders); //Route zum Ausgeben aller Ordner des Benutzers
router.delete('/:folderId', foldersController.deleteFolder); // Route zum Löschen eines Ordners

// @Autor Ilyass Dablaq

// Route zum Umbenennen eines Dokuments
router.post('/rename', async (req, res) => {
    const { documentId, newFilename } = req.body;
console.log ("cc",req.body)
    // Prüfen, ob die benötigten Daten übergeben wurden
    if (!documentId || !newFilename) {
        return res.status(400).json({ message: 'Dokument-ID und neuer Dateiname sind erforderlich' });
    }

    // Loggen, welche Operation ausgeführt wird, zur besseren Nachverfolgung
    //console.log(`Umbenennen des Dokuments mit ID ${documentId} in ${newFilename}`);

    try {
        // Benutze die Funktion, um das Dokument umzubenennen
        const updatedDocument = await renameDocumentById(documentId, newFilename);

        // Prüfen, ob das Dokument tatsächlich existiert und umbenannt wurde
        if (!updatedDocument) {
            return res.status(404).json({ message: 'Dokument nicht gefunden' });
        }

        // Erfolgsmeldung senden, jetzt als JSON
        res.json({ message: 'Dokument erfolgreich umbenannt' });
    } catch (error) {
        // Fehlerbehandlung und Loggen von Fehlern
        console.error(`Fehler beim Umbenennen des Dokuments: ${error}`);
        res.status(500).json({ message: 'Fehler beim Umbenennen des Dokuments' });
    }
});

module.exports = router;