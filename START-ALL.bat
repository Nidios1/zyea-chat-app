@echo off
echo ==========================================
echo   ZALO CLONE - Starting Full Application
echo ==========================================
echo.

REM Check MySQL
echo [1/3] Checking MySQL...
netstat -an | findstr ":3306" >nul
if errorlevel 1 (
    echo [ERROR] MySQL is not running!
    echo [ACTION] Please start MySQL from XAMPP Control Panel
    pause
    exit /b 1
)
echo [OK] MySQL is running

REM Start Backend Server
echo.
echo [2/3] Starting Backend Server...
cd /d "%~dp0server"
start "Zalo Backend Server" cmd /k "node index.js"
timeout /t 3 /nobreak >nul

REM Start Frontend Client
echo.
echo [3/3] Starting Frontend Client...
cd /d "%~dp0client"
start "Zalo Frontend Client" cmd /k "npm start"

echo.
echo ==========================================
echo   Application is starting...
echo ==========================================
echo.
echo Backend: http://192.168.0.103:5000
echo Frontend: http://192.168.0.103:3000
echo.
echo Two command windows have been opened.
echo Close those windows to stop the servers.
echo.
pause

