@echo off
set /p keep="Keep all data, table entries and files? (Y/n): "

if /i "%keep%"=="" set keep=y
if /i "%keep%"=="y" (
    echo Stopping containers while preserving data...
    docker compose down --remove-orphans
) else (
    echo WARNING: This will delete all database entries!
    set /p confirm="Are you really sure you want to delete all data? (y/N): "
    if /i "%confirm%"=="y" (
        echo Removing all data...
        docker compose down --volumes --remove-orphans
    ) else (
        echo Keeping data safe! Continuing with normal restart...
        docker compose down --remove-orphans
    )
)

echo Starting fresh containers...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build