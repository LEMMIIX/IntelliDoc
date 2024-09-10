let pipeline;

async function initEmbeddingPipeline() {
    if (!pipeline) {
        const transformers = await import('@xenova/transformers');
        pipeline = await transformers.pipeline('feature-extraction', 'Xenova/distiluse-base-multilingual-cased-v2');
    }
}

async function generateEmbedding(text) {
    await initEmbeddingPipeline();
    const output = await pipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

module.exports = {
    generateEmbedding
};