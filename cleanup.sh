#!/bin/bash

# cleanup.sh

echo "[ CLEANING IN PROGRESS ] Cleaning up Docker resources..."

# Stop all running containers
docker compose down --volumes --remove-orphans

echo "[ HERE WE GO ] Starting fresh containers..."

# Start containers with dev configuration
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build