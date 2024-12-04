@echo off
setlocal enabledelayedexpansion

:: Check requirements
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b 1
)

if /i "%~1"=="new" (
    goto :new
) else if "%~1"=="" (
    goto :start
) else (
    echo Usage: %0 [new]
    echo   no argument: Start with existing data
    echo   new: Complete reset of project containers and data
    exit /b 1
)

:new
echo WARNING: This will reset all project-related Docker resources
echo Starting fresh development environment...
set /p "CONFIRM=Are you sure? Type 'yes' to confirm: "
if /i not "!CONFIRM!"=="yes" (
    echo Operation cancelled
    exit /b 0
)
echo Cleaning up Docker environment...
:: Stop and remove containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes --remove-orphans
:: Remove specific project images
for %%i in (intellidoc-backend intellidoc-frontend pgvector/pgvector:pg16) do (
    docker image rm %%i 2>nul
)

:: Clean up any dangling images
docker image prune -f
set "COMPOSE_FORCE_DOWNLOAD=true"
set "MOUNT_INIT=./database"
goto :startup

:start
echo Starting development environment (preserving existing data^)...
set "COMPOSE_FORCE_DOWNLOAD=false"
set "MOUNT_INIT=./database-empty"
docker compose -f docker-compose.yml -f docker-compose.dev.yml down --remove-orphans

:startup
echo Starting containers...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
exit /b 0