/**
 * @fileoverview Diese Datei enthält Funktionen zur Initialisierung eines MPNet-Modells 
 * und zur Generierung von Schlüsselwörtern aus Text. Sie ermöglicht das Laden des Modells 
 * aus dem lokalen Speicher und die Berechnung von Ähnlichkeiten zwischen Text- und Wort-Embeddings.
 * 
 * @author Ayoub, Lennart
 * Die Funktionen wurden mit Unterstützung von KI-Tools angepasst und optimiert.
 */

const path = require('path');
const { performance } = require('perf_hooks');

let model;
let pipeline;
let env;

/**
 * Initialisiert das MPNet-Modell zur Extraktion von Schlüsselwörtern, falls es nicht bereits geladen wurde.
 * 
 * @async
 * @function initModel
 * @returns {Promise<Object>} Das initialisierte Modell.
 * @throws {Error} Falls das Modell nicht gefunden oder nicht geladen werden kann.
 */
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

/**
 * Generiert Schlüsselwörter aus einem gegebenen Text mithilfe eines MPNet-Embeddings.
 * 
 * @async
 * @function generateKeywords
 * @param {string} text - Der Eingabetext, aus dem Schlüsselwörter extrahiert werden.
 * @param {number} [maxKeywords=2] - Die maximale Anzahl an zurückgegebenen Schlüsselwörtern.
 * @returns {Promise<string[]>} Eine Liste der extrahierten Schlüsselwörter.
 * @throws {Error} Falls das Modell nicht geladen werden kann oder ein Fehler während der Berechnung auftritt.
 * @example
 * const keywords = await generateKeywords("Dies ist ein Beispieltext für KI-gestützte Analyse.", 3);
 * console.log(keywords); // ["Analyse", "Beispieltext", "KI"]
 */
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

        // mbedding für den vollstöndigen Text abrufen
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

/**
 * Berechnet die Kosinusähnlichkeit zwischen zwei Vektoren.
 * 
 * @function calculateCosineSimilarity
 * @param {number[]} vec1 - Der erste Vektor.
 * @param {number[]} vec2 - Der zweite Vektor.
 * @returns {number} Ein Wert zwischen -1 und 1, der die Ähnlichkeit der beiden Vektoren beschreibt.
 * @example
 * const similarity = calculateCosineSimilarity([0.1, 0.2, 0.3], [0.1, 0.25, 0.35]);
 * console.log(similarity);
 */
function calculateCosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const norm1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const norm2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (norm1 * norm2);
}

module.exports = { generateKeywords };