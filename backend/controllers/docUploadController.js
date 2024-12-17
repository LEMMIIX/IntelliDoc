/**
 * Diese Datei enthält Controller-Funktionen für das Hochladen und Verarbeiten von Dokumenten.
 * Sie ermöglicht das Hochladen von Dateien, die Extraktion von Textinhalten, die Generierung von Embeddings und die Durchführung von Clustering.
 * Zudem werden Ordnervorschläge basierend auf den Clustering-Ergebnissen bereitgestellt.
 *
 * @author Luca,Miray,Ayoub.
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

const db = require("../../ConnectPostgres");
const path = require("path");
const mammoth = require("mammoth");

const { extractTextContent } = require("../models/modelFileReader");
const modelEmbedding = require("../models/modelEmbedding");
const modelClustering = require("../models/modelClustering");
const { generateKeywords } = require("../models/modelKeywords");
const File = require("../../database/File.js");
const sequelize = require("../../sequelize.config.js");
const folderSuggestion = require("../models/modelFolderSuggestion");

exports.renderUploadForm = (req, res) => {
  // Liefere die statische HTML-Datei aus
  res.sendFile(path.join(__dirname, "../../frontend/html/docupload.html"));
};

exports.uploadFile = async (req, res) => {
  try {
    // Überprüfen, ob req.file tatsächlich vorhanden ist
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const { originalname, buffer, mimetype } = req.file;
    const { folderId, clusteringParams } = req.body; // clusteringParams hinzufügen
    const userId = req.session.userId;

    // Konvertiere folderId in eine Ganzzahl, wenn möglich
    const folderIdInt = parseInt(folderId, 10);
    // Falls folderId leer ist oder keine gültige Zahl ist, auf NULL setzen
    const folderIdToUse = isNaN(folderIdInt) ? null : folderIdInt;

    console.log("Extracting text content...");
    const textContent = await extractTextContent(
      buffer,
      mimetype,
      originalname
    );
    console.log(`Extracted text length: ${textContent.length} characters`);

    const embedding = await modelEmbedding.generateEmbedding(textContent);

    const existingFile = await File.findOne({
      where: {
        file_name: originalname,
        user_id: userId,
      },
      order: [["version", "DESC"]],
    });

    let version = 1;
    let originalFileId = null;

    if (existingFile) {
      version = existingFile.version + 1;
      originalFileId = existingFile.file_id;
    }

    const newFile = await File.create({
      user_id: userId,
      file_name: originalname,
      file_type: mimetype,
      file_data: buffer,
      folder_id: folderIdToUse,
      embedding: sequelize.literal(`'[${embedding.join(", ")}]'`),
      version: version,
      original_file_id: originalFileId,
    });

    const fileId = newFile.file_id;
    await generateKeywordsInBackground(textContent, fileId);

    const allEmbeddings = await File.findAll({
      attributes: ["file_id", "embedding"],
    });

    const existingEmbeddings = allEmbeddings.map((item) => item.embedding);
    existingEmbeddings.push(embedding);

    // Clustering parameters
    const defaultParams = {
      minClusterSize: 3,
      minSamples: 2,
      clusterSelectionMethod: "eom",
      clusterSelectionEpsilon: 0.18,
      anchorInfluence: 0.36, 
      semanticThreshold: 0.52, 
    };

    
    const clusteringConfig = {
      ...defaultParams,
      ...JSON.parse(clusteringParams || "{}"), // Allow overriding defaults through API
    };

    // Run clustering with parameters and debug info
    console.log(
      "Starting clustering process with parameters:",
      clusteringConfig
    );
    const clusteringResult = await modelClustering.runClustering(
      existingEmbeddings,
      clusteringConfig,
      userId
    );

    const clusterLabels = clusteringResult.labels;
    const clusterStats = clusteringResult.clusterStats;
    const folderContext = clusteringResult.folderContext;

    console.log("Clustering complete. Results:", clusterLabels);

    // Update cluster labels
    for (let i = 0; i < clusterLabels.length; i++) {
      const fileIdToUpdate =
        i < allEmbeddings.length ? allEmbeddings[i].file_id : fileId;
      await File.update(
        { cluster_label: clusterLabels[i] },
        { where: { file_id: fileIdToUpdate } }
      );
    }

    res.status(201).json({
      message: "File uploaded successfully",
      fileId: fileId,
      clusteringResults: {
        totalDocuments: allEmbeddings.length + 1,
        uniqueClusters: clusterStats.num_clusters,
        noisePoints: clusterStats.noise_points,
        assignedCluster: clusterLabels[clusterLabels.length - 1],
        clusterSizes: clusterStats.cluster_sizes,
      },
      ...(folderContext && {
        folderSuggestions: {
          statistics: folderContext.statistics,
          topAffinities: Object.entries(
            folderContext.affinities[clusterLabels.length - 1] || {}
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([folderId, score]) => ({
              folderId,
              folderName: folderContext.folderInfo.names[folderId],
              score: Math.round(score * 100) / 100,
            })),
        },
      }),
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res
      .status(422)
      .json({ message: "Error processing file", error: error.message });
  }
};

/**
 * Diese Funktion ermöglicht den SMART UPLOAD
 *
 * Die Funktion kann überall eingesetzt werden wo folgendes erreicht werden soll:
 * Nutzer lädt Datei hoch
 * -> Datei wird durch upload pipeline geschickt
 * -> vorerst mit folder id = NULL hochgeladen
 * -> 3 Ordnervorschläge werden gesucht und prösentiert, wo Datei hineinpassen kann
 * -> folder id wird entsprechend dem Ornder gesetzt, für den sich der Nutzer entschdeidet
 */
exports.smartUploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const { originalname, buffer, mimetype } = req.file;
    const { clusteringParams } = req.body; 
    const userId = req.session.userId;

    console.log("Extracting text content...");
    const textContent = await extractTextContent(
      buffer,
      mimetype,
      originalname
    );
    console.log(`Extracted text length: ${textContent.length} characters`);

    const embedding = await modelEmbedding.generateEmbedding(textContent);
    const formattedEmbedding = `[${embedding.join(",")}]`;

    // Check versioning
    const checkQuery = `
            SELECT file_id, version
            FROM main.files
            WHERE file_name = $1 AND user_id = $2
            ORDER BY version DESC
            LIMIT 1;
        `;
    const checkResult = await db.query(checkQuery, [originalname, userId]);

    let version = 1;
    let originalFileId = null;
    if (checkResult.rows.length > 0) {
      version = checkResult.rows[0].version + 1;
      originalFileId = checkResult.rows[0].file_id;
    }

      // Datei zunächst mit null für folder_id einfügen
    const insertQuery = `
            INSERT INTO main.files (
                user_id, file_name, file_type, file_data, 
                folder_id, embedding, version, original_file_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING file_id;
        `;
    const values = [
      userId,
      originalname,
      mimetype,
      buffer,
        null, // folder_id ist bei Smart-Upload immer null
      formattedEmbedding,
      version,
      originalFileId,
    ];

    const result = await db.query(insertQuery, values);
    const fileId = result.rows[0].file_id;

    // Generate keywords im Hintergrund
    generateKeywordsInBackground(textContent, fileId);

    //holt die embeddings 
    const embeddingsQuery = `
            SELECT file_id, embedding 
            FROM main.files 
            WHERE user_id = $1
        `;
    const embeddingsResult = await db.query(embeddingsQuery, [userId]);
    const existingEmbeddings = embeddingsResult.rows.map((row) => {
      // Convert string embedding back to array
      let emb = row.embedding;
      if (typeof emb === "string") {
        emb = emb
          .replace(/[\[\]]/g, "")
          .split(",")
          .map(Number);
      }
      return emb;
    });
    existingEmbeddings.push(embedding);

    // Clustering parameters
    const defaultParams = {
      minClusterSize: 3,
      minSamples: 2,
      clusterSelectionMethod: "eom",
      clusterSelectionEpsilon: 0.18,
      anchorInfluence: 0.36,
      semanticThreshold: 0.52,
    };

    const clusteringConfig = {
      ...defaultParams,
      ...JSON.parse(clusteringParams || "{}"),
    };

    // Run clustering
    console.log(
      "Starting clustering process with parameters:",
      clusteringConfig
    );
    const clusteringResult = await modelClustering.runClustering(
      existingEmbeddings,
      clusteringConfig,
      userId
    );

    const clusterLabels = clusteringResult.labels;
    const clusterStats = clusteringResult.clusterStats;
    const folderContext = clusteringResult.folderContext;

    // Update cluster labels
    for (let i = 0; i < clusterLabels.length; i++) {
      const fileIdToUpdate =
        i < embeddingsResult.rows.length
          ? embeddingsResult.rows[i].file_id
          : fileId;

      const updateQuery = `
                UPDATE main.files 
                SET cluster_label = $1 
                WHERE file_id = $2
            `;
      await db.query(updateQuery, [clusterLabels[i], fileIdToUpdate]);
    }

    // Get folder suggestions
    const suggestions = await folderSuggestion.getSuggestedFolders({
      docEmbedding: embedding,
      userId,
    });

    res.status(201).json({
      message: "File uploaded successfully",
      fileId: fileId,
      folderSuggestions: suggestions.suggestedFolders,
      processingTime: suggestions.processingTime,
      clusteringResults: {
        totalDocuments: existingEmbeddings.length,
        uniqueClusters: clusterStats.num_clusters,
        noisePoints: clusterStats.noise_points,
        assignedCluster: clusterLabels[clusterLabels.length - 1],
        clusterSizes: clusterStats.cluster_sizes,
      },
      ...(folderContext && {
        folderContext: {
          statistics: folderContext.statistics,
          topAffinities: Object.entries(
            folderContext.affinities[clusterLabels.length - 1] || {}
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([folderId, score]) => ({
              folderId,
              folderName: folderContext.folderInfo.names[folderId],
              score: Math.round(score * 100) / 100,
            })),
        },
      }),
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(422).json({
      message: "Error processing file",
      error: error.message,
    });
  }
};

// Keywords im Hintergrund generiert
const generateKeywordsInBackground = async (textContent, file_id) => {
  try {
    const keywords = await generateKeywords(textContent);

    // Verbinde die Keywords in eine Zeichenkette
    const keywordsString = keywords.join(", ");

    // Keywords in der Datenbank mit Sequelize speichern
    await File.update(
      { keywords: keywordsString },
      { where: { file_id: file_id } }
    );

    console.log(
      `Keywords erfolgreich für Datei mit ID ${file_id} aktualisiert.`
    );
  } catch (error) {
    console.error("Error generating keywords:", error);
  }
};

exports.checkKeywordStatus = async (req, res) => {
  const fileId = req.params.fileId; 
  try {
    // database query. um keywords für den jeweiligen fileid abzurufen
    const query = "SELECT keywords FROM main.files WHERE file_id = $1";
    const result = await db.query(query, [fileId]);

    // reszlt in keywords einpacken und als res. senden.
    const keywords = result["rows"][0]["keywords"];
    if (keywords) {
      // wenn keywords verfügbar sind.
      res.json({ keywords });
    } else {
      // warten wenn keywords noch nicht fertif sind.
      res.json({ status: "pending" });
    }
  } catch (error) {
    // Handle any errors that occur during the query
    console.error("Error checking keyword status:", error);
    res
      .status(500)
      .json({ status: "error", message: "Fehler beim Abrufen der Keywords" });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const fileName = req.params.fileId;
    const userId = req.session.userId;

    const file = await File.findOne({
      where: {
        file_name: fileName,
        user_id: userId,
      },
      attributes: ["file_data", "file_type", "file_name"],
    });

    if (!file) {
      return res.status(404).send("File not found");
    }

    const { file_data, file_type, file_name } = file;

    res.setHeader("Content-Disposition", `attachment; filename="${file_name}"`);
    res.setHeader("Content-Type", file_type);
    res.send(file_data);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).send("Error downloading file");
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.session.userId;

    // Versuche, die Datei zu finden
    const fileToDelete = await File.findOne({
      where: {
        file_id: fileId,
        user_id: userId,
      },
    });

    // Überprüfe, ob die Datei gefunden wurde
    if (!fileToDelete) {
      return res.status(404).json({
        message: "File not found or you do not have permission to delete it",
      });
    }

    // Lösche die Datei
    await fileToDelete.destroy();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Error deleting file" });
  }
};

exports.viewFile = async (req, res) => {
  try {
    const fileName = req.params.fileId;
    const userId = req.session.userId;

    // Datei mit Sequelize abrufen
    const document = await File.findOne({
      attributes: ["file_name", "file_type", "file_data", "version", "file_id"],
      where: {
        file_name: fileName,
        user_id: userId,
      },
    });

    // Überprüfen, ob die Datei gefunden wurde
    if (!document) {
      return res.status(404).json({ error: "File not found" });
    }

    // Unterschiedliche Dateitypen behandeln
    if (document.file_type === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.send(document.file_data);
    } else if (document.file_type === "text/plain") {
      res.setHeader("Content-Type", "text/html");
      res.send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>View Text File</title>
                    <style>
                        .file-content {
                            background-color: #f4f4f4;
                            padding: 10px;
                            border: 1px solid #ddd;
                            margin-top: 20px;
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>
                    <h1>${document.file_name} (Version ${document.version})</h1>
                    <pre class="file-content">${document.file_data.toString()}</pre>
                </body>
                </html>
            `);
    } else if (
      document.file_type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const docxBuffer = Buffer.from(document.file_data);
      const { value: htmlContent } = await mammoth.convertToHtml({
        buffer: docxBuffer,
      });

      res.setHeader("Content-Type", "text/html");
      res.send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>View DOCX File</title>
                    <style>
                        .file-content {
                            background-color: #f4f4f4;
                            padding: 10px;
                            border: 1px solid #ddd;
                            margin-top: 20px;
                            white-space: pre-wrap;
                        }
                    </style>
                </head>
                <body>
                    <h1>${document.file_name} (Version ${document.version})</h1>
                    <div class="file-content">${htmlContent}</div>
                </body>
                </html>
            `);
    } else {
      res.setHeader("Content-Type", document.file_type);
      res.send(document.file_data);
    }
  } catch (err) {
    console.error("Error fetching document:", err.stack);
    res
      .status(500)
      .json({ error: "Error fetching document", details: err.stack });
  }
};

//////// getVersionHistory --- neue Dokumentation für Frontend !!!
//          |
//          |
//          |
//          |
//          V

/**
 * Retrieves the complete version history for a document based on any version's fileId.
 *
 * The function works by:
 * 1. Finding the original document using the provided fileId
 * 2. Using the file name to retrieve all versions
 * 3. Returning a sorted list of all versions with metadata
 *
 * @route GET /versions/:fileId
 * @param {string} req.params.fileId - The ID of any version of the file
 * @param {string} req.session.userId - User ID from session (for authorization)
 *
 * @returns {Object} Response object
 * @returns {string} Response.fileName - The original name of the file
 * @returns {Array<Object>} Response.versions - Array of version objects
 * @returns {string} Response.versions[].file_id - Unique identifier for each version
 * @returns {number} Response.versions[].version - Version number (starts at 1)
 * @returns {Date} Response.versions[].created_at - Timestamp of version creation
 *
 * @example
 * // Frontend API call
 * const response = await fetch(`/api/versions/${fileId}`);
 * const versionHistory = await response.json();
 *
 * // Response example:
 * {
 *   fileName: "document.pdf",
 *   versions: [
 *     {
 *       file_id: "123",
 *       version: 2,
 *       created_at: "2024-11-07T14:30:00Z"
 *     },
 *     {
 *       file_id: "122",
 *       version: 1,
 *       created_at: "2024-11-07T12:00:00Z"
 *     }
 *   ]
 * }
 *
 * @errorResponse {404} File not found
 * @errorResponse {500} Server error during retrieval
 */
exports.getVersionHistory = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.session.userId;

    // Zuerst die Dateidetails für die gegebene fileId abrufen
    const originalFile = await File.findOne({
      attributes: ["original_file_id", "file_name"],
      where: {
        file_id: fileId,
        user_id: userId,
      },
    });

    if (!originalFile) {
      return res.status(404).json({
        error: "File not found",
        details:
          "The specified file ID does not exist or you do not have access to it",
      });
    }

    const fileName = originalFile.file_name;

    // Alle Versionen der Datei mit demselben Dateinamen abrufen
    const versions = await File.findAll({
      attributes: ["file_id", "version", "created_at"],
      where: {
        file_name: fileName,
        user_id: userId,
      },
      order: [["version", "DESC"]],
    });

    // Antwort mit Dateinamen und einer Liste von Versionen senden
    res.json({
      fileName: fileName,
      versions: versions,
    });
  } catch (error) {
    console.error("Error fetching version history:", error);
    res.status(500).json({
      error: "Error fetching version history",
      details:
        "An internal server error occurred while retrieving the version history",
    });
  }
};

/**
Datenbankschema-Referenz (Tabelle main.files)
Relevante Spalten für die Versionierung:

    file_id (PK): Eindeutiger Bezeichner für jede Dateiversion

    file_name: Name der Datei (wird verwendet, um Versionen zu gruppieren)

    version: Automatisch inkrementierende Versionsnummer für Dateien mit demselben Namen

    created_at: Zeitstempel des Uploads

    user_id (FK): Referenz auf den Benutzer, dem die Datei gehört
 */

exports.getFolderSuggestions = async (req, res) => {
  try {
    const { textContent, embedding } = req.body;
    const userId = req.session.userId;

    if (!textContent || !embedding) {
      return res.status(400).json({
        error: "Missing required parameters",
      });
    }

    const folderDecision = await folderSuggestion.shouldCreateNewFolder(
      embedding,
      userId
    );

    if (folderDecision.shouldCreate) {
      const suggestions = await folderSuggestion.generateFolderNames(
        textContent,
        userId,
        {
          language: "auto",
          numSuggestions: 3,
          temperature: 0.7,
        }
      );

      res.json({
        names: suggestions.suggestions,
        language: suggestions.language,
        similarFolders: folderDecision.topSimilarities,
        processingTime: folderDecision.processingTime,
      });
    } else {
      res.json({
        suggestedFolder: folderDecision.similarFolder,
        otherSimilarFolders: folderDecision.topSimilarities,
        processingTime: folderDecision.processingTime,
      });
    }
  } catch (error) {
    console.error("Error generating folder suggestions:", error);
    res.status(500).json({
      error: "Failed to generate folder suggestions",
      details: error.message,
    });
  }
};

exports.assignFolder = async (req, res) => {
  try {
    const { fileId, folderId } = req.body;
    const userId = req.session.userId;
    console.log(req.body);
    console.log(
      "checkData: fileId, folderId, userId ",
      req.body.fileId,
      req.body.folderId,
      userId
    );
    // Verify file exists and belongs to user
    const fileQuery = `
            SELECT * FROM main.files 
            WHERE file_id = $1 AND user_id = $2 AND folder_id IS NULL
        `;
    const fileResult = await db.query(fileQuery, [fileId, userId]);

    if (fileResult.rows.length === 0) {
      return res.status(404).json({
        error: "File not found or folder already assigned",
      });
    }

      // Datei mit ausgewählter folder_id aktualisieren
    const updateQuery = `
            UPDATE main.files 
            SET folder_id = $1
            WHERE file_id = $2 AND user_id = $3
            RETURNING *;
        `;
    await db.query(updateQuery, [folderId, fileId, userId]);

      // Run clustering nach der Ordnerzuweisung
    const allEmbeddings = await modelEmbedding.getAllEmbeddings(userId);
    const clusteringResult = await modelClustering.runClustering(
      allEmbeddings.map((item) => {
        let emb = item.embedding;
        if (typeof emb === "string") {
          emb = emb
            .replace(/[\[\]]/g, "")
            .split(",")
            .map(Number);
        }
        return emb;
      }),
      {
        minClusterSize: 3,
        minSamples: 2,
        clusterSelectionMethod: "eom",
        clusterSelectionEpsilon: 0.18,
      },
      userId
    );

    // Update cluster labels
    for (let i = 0; i < clusteringResult.labels.length; i++) {
      const updateClusterQuery =
        "UPDATE main.files SET cluster_label = $1 WHERE file_id = $2";
      await db.query(updateClusterQuery, [
        clusteringResult.labels[i],
        allEmbeddings[i].fileId,
      ]);
    }

    res.json({
      message: "Folder assigned successfully",
      fileId: fileId,
      folderId: folderId,
      clusteringResults: {
        totalDocuments: allEmbeddings.length,
        uniqueClusters: clusteringResult.clusterStats.num_clusters,
        noisePoints: clusteringResult.clusterStats.noise_points,
        clusterSizes: clusteringResult.clusterStats.cluster_sizes,
      },
    });
  } catch (error) {
    console.error("Error assigning folder:", error);
    res.status(500).json({
      error: "Failed to assign folder",
      details: error.message,
    });
  }
};
