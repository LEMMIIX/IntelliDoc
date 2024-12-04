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

# Copy backend files
COPY package*.json ./
RUN npm install
COPY . .
# Copy built frontend from previous stage
COPY --from=frontend-build /app/dist ./public

# Create and activate virtual environment
ENV VIRTUAL_ENV=/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# We'll mount the pip cache volume at runtime
ENV PIP_CACHE_DIR=/pip_cache

# Models will be mounted as a volume
RUN mkdir -p /app/models

# Install sentence transformers
ENV HF_TOKEN="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"
COPY download_models/ /app/download_models/

EXPOSE 3000

COPY docker-init/init.sh /app/docker-init/
RUN chmod +x /app/docker-init/init.sh
CMD ["/app/docker-init/init.sh"]