/**
 * Diese Datei enthält Controller-Funktionen für die Verwaltung von Ordnern.
 * Sie ermöglicht das Abrufen, Erstellen, Umbenennen und Löschen von Ordnern sowie das Abrufen der Ordnerstruktur eines Benutzers.
 *
 * @author Luca Neumann
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */
const Folder = require("../../database/Folder.js");
const File = require("../../database/File.js");
const sequelize = require("../../sequelize.config.js");
const { Op } = require("sequelize");
const db = require("../../ConnectPostgres.js");

// Funktion um Ordnerstruktur auszugeben
exports.getFolderTree = async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  const userId = parseInt(req.session.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Holen der Ordner mit rekursiver Abfrage
    const folders = await sequelize.query(
      `
            WITH RECURSIVE folder_tree AS (
                SELECT folder_id, parent_folder_id, folder_name, 1 AS level
                FROM main.folders
                WHERE user_id = :userId AND parent_folder_id IS NULL
                UNION ALL
                SELECT f.folder_id, f.parent_folder_id, f.folder_name, ft.level + 1
                FROM main.folders f
                JOIN folder_tree ft ON f.parent_folder_id = ft.folder_id
                WHERE f.user_id = :userId
            )
            SELECT ft.*, array_agg(files.file_id || ':' || files.file_name) AS files
            FROM folder_tree ft
            LEFT JOIN main.files files ON files.folder_id = ft.folder_id
            GROUP BY ft.folder_id, ft.parent_folder_id, ft.folder_name, ft.level
            ORDER BY ft.level, ft.folder_name;
            `,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { userId },
      }
    );

    // Dateien ohne zugewiesenen Ordner holen
    const unassignedFiles = await File.findAll({
      attributes: ["file_id", "file_name"],
      where: {
        folder_id: null,
        user_id: userId,
      },
    });

    // Funktion zum Erstellen der Ordnerstruktur
    const buildTree = (folders, parentId = null) => {
      return folders
        .filter((folder) => folder.parent_folder_id === parentId)
        .map((folder) => ({
          id: folder.folder_id,
          name: folder.folder_name,
          files: folder.files[0]
            ? folder.files
                .filter((file) => file !== null) // Überprüfe, ob der Eintrag nicht null ist
                .map((file) => {
                  const [id, name] = file.split(":");
                  return { id, name };
                })
            : [],
          children: buildTree(folders, folder.folder_id),
        }));
    };

    const folderTree = buildTree(folders);

    // Unassigned Files hinzufügen
    const unassignedFilesList = unassignedFiles.map((file) => ({
      id: file.file_id,
      name: file.file_name,
    }));

    res.json({ folderTree, unassignedFiles: unassignedFilesList });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Error fetching folders" });
  }
};

// Funktion zum Erstellen eines neuen Ordners
const { generateEmbedding } = require("../models/modelEmbedding"); // Importiere die Funktion zum Generieren von Embeddings

exports.createFolder = async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  const userId = parseInt(req.session.userId, 10);
  const { folderName, parentFolderId } = req.body;

  if (!folderName) {
    return res.status(400).json({ message: "Folder name is required" });
  }

  try {
    // Falls parentFolderId nicht angegeben oder ungültig ist, auf NULL setzen
    const parentFolderIdToUse = parentFolderId
      ? parseInt(parentFolderId, 10)
      : null;

    // Generiere das Embedding für den Ordnernamen
    const embedding = await generateEmbedding(folderName);

    // Erstelle den neuen Ordner mit Sequelize
    const newFolder = await Folder.create({
      user_id: userId,
      folder_name: folderName,
      parent_folder_id: parentFolderIdToUse,
      embedding: sequelize.literal(`'[${embedding.join(", ")}]'`),
    });

    res.status(201).json({
      message: "Folder created successfully",
      folderId: newFolder.folder_id,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Error creating folder" });
  }
};

// Funktion zum Abrufen aller Ordner des Benutzers
exports.getFolders = async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  const userId = parseInt(req.session.userId, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    // Finde alle Ordner für den angemeldeten Benutzer
    const folders = await Folder.findAll({
      where: { user_id: userId },
      attributes: ["folder_id", "folder_name"], // Nur benötigte Attribute abrufen
    });

    // Ergebnisse als JSON zurückgeben
    res.json(folders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Error fetching folders" });
  }
};

// Funktion zum Löschen eines Ordners und seiner Unterordner inklusive der enthaltenen Datein
exports.deleteFolder = async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  const userId = parseInt(req.session.userId, 10);
  const folderId = parseInt(req.params.folderId, 10);

  if (isNaN(userId) || isNaN(folderId)) {
    return res.status(400).json({ message: "Invalid user ID or folder ID" });
  }

  try {
    // Überprüfen, ob der Ordner existiert und dem Benutzer gehört
    const folder = await Folder.findOne({
      where: {
        folder_id: folderId,
        user_id: userId,
      },
    });

    if (!folder) {
      return res
        .status(404)
        .json({ message: "Folder not found or not authorized" });
    }

    // Funktion zum rekursiven Finden von Unterordnern
    const findAllSubfolders = async (parentId) => {
      const subfolders = await Folder.findAll({
        where: { parent_folder_id: parentId, user_id: userId },
      });

      let allSubfolderIds = subfolders.map((subfolder) => subfolder.folder_id);

      for (const subfolder of subfolders) {
        const childSubfolderIds = await findAllSubfolders(subfolder.folder_id);
        allSubfolderIds = allSubfolderIds.concat(childSubfolderIds);
      }

      return allSubfolderIds;
    };

    // Finde alle Unterordner-IDs
    const subfolderIds = await findAllSubfolders(folderId);
    const folderIdsToDelete = [folderId, ...subfolderIds];

    // Löschen der Dateien in allen Unterordnern
    await File.destroy({
      where: {
        folder_id: {
          [Op.in]: folderIdsToDelete,
        },
      },
    });

    // Löschen der Unterordner
    await Folder.destroy({
      where: {
        folder_id: {
          [Op.in]: folderIdsToDelete,
        },
      },
    });

    res
      .status(200)
      .json({ message: "Folder and its subfolders deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder and its subfolders:", error);
    res
      .status(500)
      .json({ message: "Error deleting folder and its subfolders" });
  }
};

// Funktion zum Umbenennen eines Ordners
exports.renameFolder = async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  const userId = parseInt(req.session.userId, 10);
  const { folderId, newFolderName } = req.body;

  if (!folderId || !newFolderName) {
    return res
      .status(400)
      .json({ message: "Ordner-ID und neuer Ordnername sind erforderlich." });
  }

  try {
    // Find and update the folder using Sequelize
    const folder = await Folder.findOne({
      where: {
        folder_id: folderId,
        user_id: userId,
      },
    });

    if (!folder) {
      return res
        .status(404)
        .json({ message: "Ordner nicht gefunden oder nicht autorisiert." });
    }

    // Update folder name
    folder.folder_name = newFolderName;
    await folder.save();

    res.json({
      message: "Ordner erfolgreich umbenannt.",
      folder: folder,
    });
  } catch (error) {
    console.error("Fehler beim Umbenennen des Ordners:", error);
    res.status(500).json({ message: "Fehler beim Umbenennen des Ordners." });
  }
};
