@echo off
echo ========================================
echo Clear Cache and Restart Metro Bundler
echo ========================================
echo.

echo [1/3] Stopping Metro bundler (if running)...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Clearing cache...
if exist .expo (
    rmdir /s /q .expo
    echo   - Removed .expo folder
)
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo   - Removed node_modules\.cache folder
)
echo   - Cache cleared!

echo [3/3] Starting Metro bundler with cleared cache...
echo.
echo Starting Expo with --clear flag...
npx expo start --clear

pause

