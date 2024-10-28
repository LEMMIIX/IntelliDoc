const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function runClustering(embeddings) {
    return new Promise((resolve, reject) => {
        // Ensure embeddings are properly formatted arrays
        const formattedEmbeddings = embeddings.map(emb => {
            // If the embedding is from PostgreSQL, it might be in string format
            if (typeof emb === 'string') {
                // Remove brackets and split into numbers
                return emb.replace(/[\[\]]/g, '').split(',').map(Number);
            }
            // If it's already an array, ensure all elements are numbers
            if (Array.isArray(emb)) {
                return emb.map(Number);
            }
            // If it's an object with embedding property
            if (emb.embedding) {
                if (typeof emb.embedding === 'string') {
                    return emb.embedding.replace(/[\[\]]/g, '').split(',').map(Number);
                }
                return emb.embedding.map(Number);
            }
            throw new Error('Invalid embedding format');
        });

        // Save formatted embeddings to temporary file
        const tempFilePath = path.join(os.tmpdir(), `embeddings_${Date.now()}.json`);
        fs.writeFileSync(tempFilePath, JSON.stringify(formattedEmbeddings));

        const scriptPath = path.join(__dirname, '../models/cluster.py');

        // Execute Python script with temporary file path
        exec(`python ${scriptPath} ${tempFilePath}`, (error, stdout, stderr) => {
            // Clean up temporary file
            fs.unlinkSync(tempFilePath);

            if (error) {
                console.error(`Error executing clustering script: ${error}`);
                console.error(`stderr: ${stderr}`);
                reject(error);
                return;
            }
            
            try {
                const clusterLabels = JSON.parse(stdout);
                resolve(clusterLabels);
            } catch (parseError) {
                console.error('Error parsing clustering results:', parseError);
                reject(parseError);
            }
        });
    });
}

module.exports = {
    runClustering
};