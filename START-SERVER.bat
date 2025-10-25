@echo off
echo ==========================================
echo   ZALO CLONE - Starting Backend Server
echo ==========================================
echo.

cd /d "%~dp0server"

echo [1/2] Checking if MySQL is running...
netstat -an | findstr ":3306" >nul
if errorlevel 1 (
    echo [ERROR] MySQL is not running!
    echo [ACTION] Please start MySQL from XAMPP Control Panel
    echo.
    pause
    exit /b 1
)
echo [OK] MySQL is running

echo.
echo [2/2] Starting Node.js server...
echo Server will be available at:
echo   - http://localhost:5000
echo   - http://192.168.0.102:5000
echo.
echo Press Ctrl+C to stop the server
echo.

node index.js

pause

