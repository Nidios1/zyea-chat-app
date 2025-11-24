@echo off
echo ==========================================
echo   ZALO CLONE - Starting with Docker MySQL
echo ==========================================
echo.

REM Check Docker
echo [0/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not running!
    echo [ACTION] Please install Docker Desktop and start it
    pause
    exit /b 1
)
echo [OK] Docker is available

REM Start Docker MySQL
echo.
echo [1/4] Starting Docker MySQL...
cd /d "%~dp0"
docker-compose up -d mysql
if errorlevel 1 (
    echo [ERROR] Failed to start Docker MySQL!
    pause
    exit /b 1
)
timeout /t 5 /nobreak >nul
echo [OK] Docker MySQL is running

REM Check MySQL connection
echo.
echo [2/4] Checking MySQL connection...
timeout /t 3 /nobreak >nul
netstat -an | findstr ":3306" >nul
if errorlevel 1 (
    echo [WARNING] MySQL port 3306 not accessible, but container may still be starting...
) else (
    echo [OK] MySQL is accessible on port 3306
)

REM Start Backend Server
echo.
echo [3/4] Starting Backend Server...
cd /d "%~dp0server"
start "Zalo Backend Server" cmd /k "node index.js"
timeout /t 3 /nobreak >nul

REM Start Frontend Client
echo.
echo [4/4] Starting Frontend Client...
cd /d "%~dp0client"
start "Zalo Frontend Client" cmd /k "npm start"

echo.
echo ==========================================
echo   Application is starting...
echo ==========================================
echo.
echo Docker MySQL: localhost:3306
echo Backend: http://192.168.0.103:5000
echo Frontend: http://192.168.0.103:3000
echo.
echo To stop Docker MySQL: docker-compose stop
echo To view MySQL logs: docker-compose logs mysql
echo.
echo Two command windows have been opened.
echo Close those windows to stop the servers.
echo.
pause

