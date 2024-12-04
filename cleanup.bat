@echo off
setlocal enabledelayedexpansion

:: First prompt with YES as default
set /p "keep=Keep all files and data? (Y/n): "
if "!keep!"=="" set "keep=Y"

if /i "!keep!"=="n" (
    :: Second prompt with NO as default
    set /p "confirm=Are you sure you want to delete all data? (y/N): "
    if "!confirm!"=="" set "confirm=N"
    
    if /i "!confirm!"=="y" (
        echo Removing all data...
        docker compose down --volumes --remove-orphans
        :: Export environment variable for docker compose
        set "COMPOSE_FORCE_DOWNLOAD=true"
    ) else (
        echo Keeping data safe! Continuing with normal restart...
        docker compose down --remove-orphans
        set "COMPOSE_FORCE_DOWNLOAD=false"
    )
) else (
    echo Stopping containers while preserving data...
    docker compose down --remove-orphans
    set "COMPOSE_FORCE_DOWNLOAD=false"
)

echo Starting fresh containers...
:: Use the environment variable normally
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build