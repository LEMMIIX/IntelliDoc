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

      // Configure path to node_modules/@xenova/transformers/models
      env.localModelPath = path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', 'models');
      env.allowRemoteModels = false; // Disable remote loading when using local files

      // Custom cache directory configuration (optional - you might not need this)
      env.cacheDir = path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', 'models');

      // Custom cache directory configuration
      env.cacheDir = path.join(__dirname, 'model_cache'); // Adjust path as needed

      try {
        // First attempt: Try loading from local path
        model = await pipeline('feature-extraction', 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2', {
          quantized: false,
          local: true // Force local loading
        });
        console.log('MPNet model loaded successfully from local storage');
      } catch (localError) {
        console.log('Local model not found, attempting remote download...');
        // Second attempt: If local fails, enable remote loading and try again
        env.allowRemoteModels = true;
        model = await pipeline('feature-extraction', 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2', {
          quantized: false
        });
        console.log('MPNet model downloaded and loaded successfully');
      }
    } catch (error) {
      console.error('Error loading MPNet model:', error);
      throw error;
    }
  }
}

async function generateEmbedding(text) {
  await initModel();
  
  const startTime = performance.now();
  
  console.log('Generating embedding...');
  const output = await model(text, { pooling: 'mean', normalize: true });
  
  const endTime = performance.now();
  const processingTime = (endTime - startTime).toFixed(2);
  console.log(`Embedding processing time: ${processingTime} ms\nEmbedding successful.`);
  return Array.from(output.data);
}

async function getAllEmbeddings() {
  const query = 'SELECT embedding, file_id FROM main.files';
  const result = await db.query(query);
  return result.rows.map(row => ({
    embedding: row.embedding,
    fileId: row.file_id
  }));
}

module.exports = { generateEmbedding, getAllEmbeddings };