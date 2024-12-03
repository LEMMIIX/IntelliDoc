#!/bin/bash

# First prompt with YES as default
read -p "Keep all files and data? (Y/n): " keep
keep=${keep:-Y}

if [[ $keep =~ ^[Nn]$ ]]; then
    # Second prompt with NO as default
    read -p "Are you sure you want to delete all data? (y/N): " confirm
    confirm=${confirm:-N}
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo "Removing all data..."
        docker compose down --volumes --remove-orphans
    else
        echo "Keeping data safe! Continuing with normal restart..."
        docker compose down --remove-orphans
    fi
else
    echo "Stopping containers while preserving data..."
    docker compose down --remove-orphans
fi

echo "Starting fresh containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build