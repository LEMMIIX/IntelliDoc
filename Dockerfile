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

# Set up Python environment
ENV VIRTUAL_ENV=/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ENV PIP_CACHE_DIR=/pip_cache
RUN mkdir -p /app/models

# Ensure script permissions - move this AFTER all files are copied
RUN chmod +x /app/docker-init/*.sh && \
    ls -la /app/docker-init/

ENV HF_TOKEN="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"
COPY download_models/ /app/download_models/

EXPOSE 3000

CMD ["/app/docker-init/init.sh"]