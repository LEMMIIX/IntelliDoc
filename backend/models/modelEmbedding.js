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

      // Define base paths - Updated to use Xenova's model path
      const baseModelPath = path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', 'models');
      const modelName = 'Xenova/paraphrase-multilingual-mpnet-base-v2';
      
      // Configure environment
      env.localModelPath = baseModelPath;
      env.cacheDir = baseModelPath;
      env.allowRemoteModels = false;

      const modelPath = path.join(baseModelPath, modelName.split('/')[0], modelName.split('/')[1]);
      console.log('Looking for model in:', modelPath);

      try {
        // First attempt: Try loading from local path with ONNX configuration
        model = await pipeline('feature-extraction', modelName, {
          quantized: true, // Use quantized model by default for better performance
          local: true,
          revision: 'main',
          modelPath: modelPath,
          progress_callback: (progress) => {
            console.log(`Loading progress: ${Math.round(progress * 100)}%`);
          }
        });
        console.log('MPNet model loaded successfully from local storage');
      } catch (localError) {
        console.error('Local loading error:', localError.message);
        throw new Error('Model not found locally. Please ensure the model is downloaded with the correct structure.');
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
    normalize: true,
    //max_length: 512 // Add max length to prevent issues with very long texts
  });
  
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