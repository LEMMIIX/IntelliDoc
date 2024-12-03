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

# Add Python
RUN apt-get update && apt-get install -y python3 python3-pip

EXPOSE 3000

CMD ["node", "app.js", "--optimize-for-size"]