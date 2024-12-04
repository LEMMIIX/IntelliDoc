@echo OFF
echo STOPPING ALL DOCKER CONTAINERS

FOR /F "tokens=*" %%i IN ('powershell -Command "docker ps -q"') DO (
    docker stop %%i
)

echo ALL CONTAINERS STOPPED
pause
