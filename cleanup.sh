#!/bin/bash

# Check requirements
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

function cleanup_docker() {
    echo "Cleaning up Docker environment..."
    # Stop and remove containers
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes --remove-orphans
    
    # Remove specific project images
    for img in intellidoc-backend intellidoc-frontend pgvector/pgvector:pg16; do
        docker image rm $img 2>/dev/null || true
    done
    
    # Clean up any dangling images
    docker image prune -f
}

function start_containers() {
    echo "Starting containers..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
}

case "$1" in
    "new")
        echo "WARNING: This will reset all project-related Docker resources"
        echo "Starting fresh development environment..."
        read -p "Are you sure? Type 'yes' to confirm: " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo "Operation cancelled"
            exit 0
        fi
        cleanup_docker
        export COMPOSE_FORCE_DOWNLOAD=true
        export MOUNT_INIT=./database
        ;;
    "")
        echo "Starting development environment (preserving existing data)..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans
        export COMPOSE_FORCE_DOWNLOAD=false
        export MOUNT_INIT=./database-empty
        ;;
    *)
        echo "Usage: $0 [new]"
        echo "  no argument: Start with existing data"
        echo "  new: Complete reset of project containers and data"
        exit 1
        ;;
esac

start_containers