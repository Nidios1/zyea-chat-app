@echo off
echo ========================================
echo FIX BLACK SCREEN - BUILD SCRIPT
echo ========================================

echo.
echo [1/5] Cleaning previous builds...
cd /d "%~dp0"
if exist "build" rmdir /s /q "build"
if exist "ios\App\public" rmdir /s /q "ios\App\public"

echo.
echo [2/5] Installing dependencies...
call npm install

echo.
echo [3/5] Building React app...
call npm run build

echo.
echo [4/5] Syncing with Capacitor...
call npx cap sync ios

echo.
echo [5/5] Opening Xcode for final build...
call npx cap open ios

echo.
echo ========================================
echo BUILD COMPLETE!
echo ========================================
echo.
echo IMPORTANT NOTES:
echo - The black screen issue should now be fixed
echo - MainViewController is properly configured
echo - WebView error handling is added
echo - Server config removed for production
echo.
echo Next steps:
echo 1. In Xcode, clean build folder (Cmd+Shift+K)
echo 2. Build for device (Cmd+B)
echo 3. Archive and export IPA
echo.
pause
