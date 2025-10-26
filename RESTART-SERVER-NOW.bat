@echo off
echo ========================================
echo   RESTARTING SERVER
echo ========================================
echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe /T 2>nul

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
cd server
start cmd /k "npm start"

echo.
echo ========================================
echo   Server restarting...
echo ========================================
echo.
echo Please check the new window for server logs.
echo.
pause

