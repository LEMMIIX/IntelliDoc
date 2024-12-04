# Build frontend
FROM node:20 AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend stage
FROM node:20
WORKDIR /app

# Install PostgreSQL client tools along with Python dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql-client

# Copy backend files first
COPY package*.json ./
RUN npm install
COPY . .
COPY --from=frontend-build /app/dist ./public

# Set up Python environment
ENV VIRTUAL_ENV=/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ENV PIP_CACHE_DIR=/pip_cache
RUN mkdir -p /app/models

# Das Skript wird HIER erstellt, um file permission errors zu umgehen
# da git Schwierigkeiten hat file permissions zu transferieren
# deshalb, damit das Skript nicht von der Dockerfile aufgerufen wird,
# wird das HIER erstellt, somit kommt es nicht zu execution errors
RUN echo '#!/bin/bash\n\
echo "COMPOSE_FORCE_DOWNLOAD value: $COMPOSE_FORCE_DOWNLOAD"\n\
\n\
until pg_isready -h postgres -p 5432 -U postgres; do\n\
    echo "Waiting for PostgreSQL..."\n\
    sleep 2\n\
done\n\
\n\
if [ "$COMPOSE_FORCE_DOWNLOAD" = "true" ] || [ ! -d "/app/node_modules/@xenova/transformers/models/Xenova" ]; then\n\
    echo "Installing Python requirements..."\n\
    pip install -r /app/docker-init/pip-requirements.txt\n\
    \n\
    echo "Downloading models..."\n\
    python3 /app/download_models/all-mpnet-base-v2.py\n\
    python3 /app/download_models/paraphrase-multilingual-mpnet-base-v2.py\n\
fi\n\
\n\
echo "Starting application..."\n\
node app.js --optimize-for-size' > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

ENV HF_TOKEN="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"
EXPOSE 3000

CMD ["/app/entrypoint.sh"]