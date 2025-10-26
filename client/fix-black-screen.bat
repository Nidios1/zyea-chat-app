@echo off
echo 🔧 Fixing Black Screen Issue for iOS IPA...
echo.

echo 📦 Building React app...
call npm run build
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
echo ✅ Fixes applied:
echo    - Bundle Protection temporarily disabled
echo    - Splash screen handling improved
echo    - Debug logging added
echo    - Capacitor config updated
echo.
echo 🚀 Ready to build IPA! Check Xcode console for debug logs.
pause
