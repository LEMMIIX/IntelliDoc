const path = require('path');

let pipeline;

async function initEmbeddingPipeline() {
    if (!pipeline) {
        console.log('Initializing embedding pipeline...');
        try {
            const { pipeline: createPipeline, env } = await import('@xenova/transformers');
            
            // Set and log the custom cache directory
            const modelCacheDir = path.join(__dirname, '..', 'embed_models');
            env.cacheDir = modelCacheDir;
            console.log('Custom cache directory set to:', modelCacheDir);

            console.log('Starting model loading...');
            pipeline = await createPipeline('feature-extraction', 'Xenova/distiluse-base-multilingual-cased-v2', {
                cache_dir: modelCacheDir,
                progress_callback: (progress) => {
                    if (progress && typeof progress.progress === 'number') {
                        console.log(`Model loading progress: ${progress.progress.toFixed(2)} - ${progress.status || 'Loading...'}`);
                    } else {
                        console.log('Model loading in progress...');
                    }
                }
            });
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error during pipeline initialization:', error);
            throw error;
        }
    }
}

async function generateEmbedding(text) {
    try {
        await initEmbeddingPipeline();
        console.log('Generating embedding...');
        const output = await pipeline(text, { pooling: 'mean', normalize: true });
        console.log('Embedding generated successfully');
        return Array.from(output.data);
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

module.exports = {
    generateEmbedding
};