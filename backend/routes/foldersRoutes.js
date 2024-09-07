// @Autor Luca Neumann
const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');

router.get('/tree', foldersController.getFolderTree); //Route zum Ausgaben der Ordnerstruktur
router.post('/create', foldersController.createFolder); //Route zum erstellen eines Ordners
router.get('/', foldersController.getFolders); //Route zum Ausgeben aller Ordner des Benutzers
router.delete('/:folderId', foldersController.deleteFolder); // Route zum Löschen eines Ordners

module.exports = router;