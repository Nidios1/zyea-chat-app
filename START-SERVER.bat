@echo off
echo ==========================================
echo   ZALO CLONE - Starting Server
echo ==========================================
echo.

REM Check Docker
echo [1/3] Checking Docker MySQL...
docker ps | findstr "zalo-clone-mysql" >nul
if errorlevel 1 (
    echo [WARNING] Docker MySQL is not running!
    echo [ACTION] Starting Docker MySQL...
    docker-compose up -d mysql
    if errorlevel 1 (
        echo [ERROR] Failed to start Docker MySQL!
        echo [INFO] Make sure Docker Desktop is running
        pause
        exit /b 1
    )
    echo [OK] Waiting for MySQL to be ready...
    timeout /t 10 /nobreak >nul
) else (
    echo [OK] Docker MySQL is running
)

REM Check if server is already running
echo.
echo [2/3] Checking if server is already running...
netstat -an | findstr ":5000" >nul
if not errorlevel 1 (
    echo [INFO] Server is already running on port 5000
    echo [INFO] If you want to restart, please stop the current server first
    pause
    exit /b 0
)

REM Start Backend Server
echo.
echo [3/3] Starting Backend Server...
cd /d "%~dp0server"
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [OK] Starting server...
start "Zalo Backend Server" cmd /k "node index.js"

timeout /t 3 /nobreak >nul

echo.
echo ==========================================
echo   Server is starting...
echo ==========================================
echo.
echo Backend: http://192.168.0.103:5000
echo Backend: http://localhost:5000
echo.
echo A command window has been opened.
echo Close that window to stop the server.
echo.
pause

