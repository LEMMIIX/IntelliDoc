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
    ) else (
        echo Keeping data safe! Continuing with normal restart...
        docker compose down --remove-orphans
    )
) else (
    echo Stopping containers while preserving data...
    docker compose down --remove-orphans
)

echo Starting fresh containers...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build