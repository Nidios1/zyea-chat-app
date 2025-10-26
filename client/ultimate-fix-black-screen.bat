@echo off
echo 🔧 ULTIMATE FIX for iOS Black Screen Issue...
echo.

echo 📦 Building React app with ULTIMATE fixes...
call npm run build:win
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🔄 Syncing with Capacitor...
call npx cap sync ios
if %errorlevel% neq 0 (
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo 📱 Opening iOS project...
call npx cap open ios

echo.
echo ✅ ULTIMATE FIXES applied:
echo    - Bundle Protection COMPLETELY disabled
echo    - Loading screen ALWAYS shows with background
echo    - Safety timeout prevents infinite loading
echo    - Enhanced debug logging
echo    - Simplified loading logic
echo.
echo 🚀 Ready to build IPA! This should fix the black screen completely.
echo 📱 Check Xcode console for detailed debug logs.
pause
