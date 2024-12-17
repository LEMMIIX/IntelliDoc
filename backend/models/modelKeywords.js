/**
 * Diese Datei enthält Funktionen zur Initialisierung eines MPNet-Modells und zur Generierung von Schlüsselwörtern aus Text.
 * Sie ermöglicht das Laden des Modells aus dem lokalen Speicher und die Berechnung von Ähnlichkeiten zwischen Text- und Wort-Embeddings.
 *
 * @autor Ayoub
 * Die Funktionen wurden mit Unterstützung von KI tools angepasst und optimiert
 */

const path = require('path');
const { performance } = require('perf_hooks');

let model;
let pipeline;
let env;

async function initModel() {
    if (!model) {
        console.log('Initializing MPNet model for keywords...');
        try {
            const transformers = await import('@xenova/transformers');
            pipeline = transformers.pipeline;
            env = transformers.env;

            const baseModelPath = path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', 'models');
            const modelName = 'Xenova/all-mpnet-base-v2';
            
            env.localModelPath = baseModelPath;
            env.cacheDir = baseModelPath;
            env.allowRemoteModels = false;

            const modelPath = path.join(baseModelPath, 'Xenova', 'all-mpnet-base-v2');
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
                console.log('Model loaded successfully from local storage');
            } catch (localError) {
                console.error('Local loading error:', localError.message);
                throw new Error(`Model not found locally at ${modelPath}. Please ensure the model is downloaded.`);
            }
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }
    return model;
}

async function generateKeywords(text, maxKeywords = 2) {
    const startTime = performance.now();
    console.log('Starting keyword generation...');

    try {
        await initModel();
        
        // Text in Wörter aufteilen und Duplikate/kurze Wörter entfernen
        const words = [...new Set(text.toLowerCase()
            .match(/\b\w+\b/g)
            ?.filter(word => word.length > 3) || [])];
        
        if (words.length === 0) {
            return [];
        }

        // mbedding für den vollständigen Text abrufen
        const textEmbedding = await model(text, {
            pooling: 'mean',
            normalize: true
        });

        // embedding für einzelne Wörter abrufen
        const wordEmbeddings = await Promise.all(
            words.map(async word => ({
                word,
                embedding: await model(word, {
                    pooling: 'mean',
                    normalize: true
                })
            }))
        );

        // Berechnt similarity scores
        const keywordScores = wordEmbeddings.map(({ word, embedding }) => ({
            word,
            score: calculateCosineSimilarity(textEmbedding.data, embedding.data)
        }));

        // sortiere die Keywords nach score und wähle die besten aus
        const keywords = keywordScores
            .sort((a, b) => b.score - a.score)
            .slice(0, maxKeywords);

        const endTime = performance.now();
        console.log(`Keyword generation completed in ${(endTime - startTime).toFixed(2)}ms`);
        console.log('Keywords found:', keywords);

        return keywords.map(k => k.word);

    } catch (error) {
        console.error('Error generating keywords:', error);
        throw error;
    }
}

function calculateCosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (norm1 * norm2);
}

module.exports = { generateKeywords };