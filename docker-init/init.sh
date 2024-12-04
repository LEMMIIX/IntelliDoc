#!/bin/bash
set -e

echo "COMPOSE_FORCE_DOWNLOAD value: $COMPOSE_FORCE_DOWNLOAD"

# Wait for PostgreSQL
until pg_isready -h postgres -p 5432 -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Always check if models exist, regardless of COMPOSE_FORCE_DOWNLOAD
if [ "$COMPOSE_FORCE_DOWNLOAD" = "true" ] || [ ! -f "/app/models/all-mpnet-base-v2/pytorch_model.bin" ]; then
    echo "Installing Python requirements..."
    pip install -r /app/docker-init/pip-requirements.txt
    
    echo "Downloading models..."
    python3 /app/download_models/all-mpnet-base-v2.py
    python3 /app/download_models/paraphrase-multilingual-mpnet-base-v2.py
    
    # Verify downloads succeeded
    if [ ! -f "/app/models/all-mpnet-base-v2/pytorch_model.bin" ]; then
        echo "Model download failed!"
        exit 1
    fi
fi

# Wait a bit longer for PostgreSQL to be fully ready
sleep 5

# Start the application
echo "Starting application..."
node app.js --optimize-for-size