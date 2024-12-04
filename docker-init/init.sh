#!/bin/bash

# Only install requirements if FORCE_DOWNLOAD is true or if they're not already installed
if [ "$FORCE_DOWNLOAD" = "true" ] || ! pip freeze | grep -q "sentence-transformers"; then
    echo "Installing Python requirements..."
    pip install -r /docker-init/pip-requirements.txt
else
    echo "Python requirements already installed, skipping..."
fi

# Only download models if FORCE_DOWNLOAD is true or if they don't exist
if [ "$FORCE_DOWNLOAD" = "true" ] || [ ! -f "/app/models/all-mpnet-base-v2/pytorch_model.bin" ]; then
    echo "Downloading models..."
    python3 /app/download_models/all-mpnet-base-v2.py
    python3 /app/download_models/paraphrase-multilingual-mpnet-base-v2.py
else
    echo "Models already exist, skipping download..."
fi

# Initialize database
./docker-init/database-init.sh

# Start the application
node app.js --optimize-for-size