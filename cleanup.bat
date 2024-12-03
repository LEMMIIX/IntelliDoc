@echo off
echo [ CLEANING IN PROGRESS ] Cleaning up Docker resources...

docker compose down --volumes --remove-orphans

echo [ HERE WE GO ] Starting fresh containers...

docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build