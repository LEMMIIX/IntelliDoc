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

      // Allow remote model loading
      env.allowRemoteModels = true;

      model = await pipeline('feature-extraction', 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2', {
        quantized: false  // Disable quantization to use the full model
      });
      console.log('MPNet model loaded successfully');
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
  console.log(`Embedding processing time: ${processingTime} ms\nEmbedding successfull.`);
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