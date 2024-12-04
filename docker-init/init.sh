#!/bin/bash
set -e

echo "COMPOSE_FORCE_DOWNLOAD value: $COMPOSE_FORCE_DOWNLOAD"

# Wait for PostgreSQL
until pg_isready -h postgres -p 5432 -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Check if models exist in the Node.js expected location
MODEL_PATH="/app/node_modules/@xenova/transformers/models/Xenova"
if [ "$COMPOSE_FORCE_DOWNLOAD" = "true" ] || [ ! -d "$MODEL_PATH" ]; then
    echo "Installing Python requirements..."
    pip install -r /app/docker-init/pip-requirements.txt
    
    echo "Downloading models..."
    python3 /app/download_models/all-mpnet-base-v2.py
    python3 /app/download_models/paraphrase-multilingual-mpnet-base-v2.py
    
    # Verify downloads succeeded by checking Node.js model path
    if [ ! -d "$MODEL_PATH" ]; then
        echo "Model download failed! Expected path: $MODEL_PATH"
        exit 1
    fi
fi

# Wait a bit longer for PostgreSQL to be fully ready
sleep 5

# Start the application
echo "Starting application..."
node app.js --optimize-for-size