/**
 * Diese Datei enthölt Funktionen zur Initialisierung und Nutzung eines MPNet-Modells zur Generierung von Embeddings.
 * Sie ermöglicht das Laden des Modells, das Generieren von Text-Embeddings und das Abrufen aller Embeddings eines Benutzers aus der Datenbank.
 *
 * @author Lennart,Miray
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

const path = require('path');
const { performance } = require('perf_hooks');
const db = require('../../ConnectPostgres');

let model;
let pipeline;
let env;

async function initModel() {
  if (!model) {
    console.log('Initializing MPNet model...');
    try {
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      env = transformers.env;

      // Use absolute path to model directory
      const baseModelPath = path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', 'models');
      const modelName = 'Xenova/paraphrase-multilingual-mpnet-base-v2';
      
      // Configure environment
      env.localModelPath = baseModelPath;
      env.cacheDir = baseModelPath;
      env.allowRemoteModels = false;

      const modelPath = path.join(baseModelPath, 'Xenova', 'paraphrase-multilingual-mpnet-base-v2');
      console.log('Looking for model in:', modelPath);

      try {
        model = await pipeline('feature-extraction', modelName, {
          quantized: true,
          local: true,
          revision: 'main',
          modelPath: modelPath,
          progress_callback: (progress) => {
            if (progress) {  
              console.log(`Loading progress: ${Math.round(progress * 100)}%`);
            }
          }
        });
        console.log('MPNet model loaded successfully from local storage');
      } catch (localError) {
        console.error('Local loading error:', localError.message);
        throw new Error(`Model not found locally at ${modelPath}. Please ensure the model is downloaded with the correct structure.`);
      }
    } catch (error) {
      console.error('Error loading MPNet model:', error);
      throw error;
    }
  }
  return model;
}

async function generateEmbedding(text) {
  await initModel();
  
  const startTime = performance.now();
  
  console.log('Generating embedding...');
  const output = await model(text, { 
    pooling: 'mean', 
    normalize: true
  });
  
  const endTime = performance.now();
  const processingTime = (endTime - startTime).toFixed(2);
  console.log(`Embedding processing time: ${processingTime} ms\nEmbedding successful.`);
  return Array.from(output.data);
}

async function getAllEmbeddings(userId) {
  if (!userId) {
    throw new Error('userId is required for security purposes');
  }
  
  const query = `
    SELECT embedding, file_id 
    FROM main.files 
    WHERE user_id = $1 
    AND embedding IS NOT NULL
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows.map(row => ({
    embedding: row.embedding,
    fileId: row.file_id
  }));
}

module.exports = { generateEmbedding, getAllEmbeddings };