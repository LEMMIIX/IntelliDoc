#!/bin/bash

read -p "Keep all data, table entries and files? (Y/n): " keep

keep=${keep:-y}
if [[ $keep =~ ^[Yy]$ ]] || [[ $keep == "" ]]; then
    echo "Stopping containers while preserving data..."
    docker compose down --remove-orphans
else
    echo "WARNING: This will delete all database entries!"
    read -p "Are you really sure you want to delete all data? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        echo "Removing all data..."
        docker compose down --volumes --remove-orphans
    else
        echo "Keeping data safe! Continuing with normal restart..."
        docker compose down --remove-orphans
    fi
fi

echo "Starting fresh containers..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build