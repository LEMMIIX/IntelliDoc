# Build frontend
FROM node:20 AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NODE_ENV=production
RUN npm run build

# Build backend dependencies
FROM node:20 AS backend-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Final stage
FROM node:20
WORKDIR /app

# Install tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Environment setup
ENV VIRTUAL_ENV=/app/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV PIP_CACHE_DIR=/pip_cache
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV HF_TOKEN="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"

# Set up directories and Python environment
RUN python3 -m venv $VIRTUAL_ENV && \
    mkdir -p /app/models \
    /app/node_modules/@xenova/transformers/models/Xenova

# Copy files
COPY --from=backend-deps /app/node_modules ./node_modules
COPY --from=frontend-build /app/dist ./frontend/dist
COPY . .

# Install Python requirements
COPY docker-init/pip-requirements.txt ./
RUN pip install --no-cache-dir -r pip-requirements.txt requests huggingface_hub

# Create initialization script
RUN echo '#!/bin/bash\n\
\n\
# Wait for PostgreSQL\n\
until pg_isready -h postgres -p 5432 -U postgres; do\n\
    echo "Waiting for PostgreSQL..."\n\
    sleep 2\n\
done\n\
\n\
# Check and download models if needed\n\
MODEL1="/app/node_modules/@xenova/transformers/models/Xenova/paraphrase-multilingual-mpnet-base-v2/tokenizer.json"\n\
MODEL2="/app/node_modules/@xenova/transformers/models/Xenova/all-mpnet-base-v2/tokenizer.json"\n\
\n\
if [ ! -f "$MODEL1" ] || [ ! -f "$MODEL2" ]; then\n\
    echo "Models not found. Downloading..."\n\
    cd /app\n\
    python3 -u download_models/paraphrase-multilingual-mpnet-base-v2.py\n\
    python3 -u download_models/all-mpnet-base-v2.py\n\
fi\n\
\n\
# Start the application\n\
exec node app.js --optimize-for-size\n\
' > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

EXPOSE 3000
CMD ["/app/entrypoint.sh"]