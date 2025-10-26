@echo off
echo ============================================
echo  Restore Original App.js
echo ============================================
echo.

if not exist "src\App.js.backup" (
    echo ❌ Error: Backup file not found!
    echo No backup exists at: src\App.js.backup
    pause
    exit /b 1
)

echo Restoring original App.js from backup...
copy src\App.js.backup src\App.js >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Could not restore file
    pause
    exit /b 1
)

echo ✅ Original App.js restored!
echo.

set /p rebuild="Rebuild now? (y/n): "
if /i "%rebuild%"=="y" (
    echo.
    echo Building...
    call npm run build:win
    echo.
    echo Syncing...
    call npx cap sync ios
    echo.
    echo ✅ Done! Ready to commit and build IPA.
)

echo.
pause

