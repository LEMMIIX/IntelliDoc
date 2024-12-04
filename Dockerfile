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

# Copy backend files
COPY package*.json ./
RUN npm install
COPY . .
# Copy built frontend from previous stage
COPY --from=frontend-build /app/dist ./public

# Add Python and virtual environment dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv

# Create and activate virtual environment
ENV VIRTUAL_ENV=/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# We'll mount the pip cache volume at runtime
ENV PIP_CACHE_DIR=/pip_cache

# Install Python packages in virtual environment
COPY docker-init/pip-requirements.txt /app/
RUN --mount=type=cache,target=/pip_cache \
    pip3 install --no-cache-dir -r /app/pip-requirements.txt

# Models will be mounted as a volume
RUN mkdir -p /app/models

# Install sentence transformers
ENV HF_TOKEN="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"
COPY download_models/ /app/download_models/
RUN python3 /app/download_models/all-mpnet-base-v2.py
RUN python3 /app/download_models/paraphrase-multilingual-mpnet-base-v2.py

EXPOSE 3000

COPY docker-init/init.sh /app/
RUN chmod +x /app/init.sh
CMD ["/app/init.sh"]