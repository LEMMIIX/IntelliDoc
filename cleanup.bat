@echo off
setlocal enabledelayedexpansion

:: First prompt with YES as default
set /p "keep=Keep all files and data? (Y/n): "
if "!keep!"=="" set "keep=Y"

:: Convert input to lowercase
set "keep=!keep:~0,1!"
set "keep=!keep:N=n!"
set "keep=!keep:Y=y!"

if "!keep!"=="n" (
    set /p "confirm=Are you sure you want to delete all data? (y/N): "
    if "!confirm!"=="" set "confirm=N"
    
    set "confirm=!confirm:~0,1!"
    set "confirm=!confirm:Y=y!"
    set "confirm=!confirm:N=n!"
    
    if "!confirm!"=="y" (
        echo Removing all data...
        docker compose down --volumes --remove-orphans
        set "COMPOSE_FORCE_DOWNLOAD=true"
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    ) else (
        echo Keeping data safe! Continuing with normal restart...
        docker compose down --remove-orphans
        set "COMPOSE_FORCE_DOWNLOAD=false"
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
    )
) else (
    echo Stopping containers while preserving data...
    docker compose down --remove-orphans
    set "COMPOSE_FORCE_DOWNLOAD=false"
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
)