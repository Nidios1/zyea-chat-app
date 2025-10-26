@echo off
echo ===================================
echo   BUILD ZYEA+ FACEBOOK APP
echo ===================================
echo.

cd zyea-plus-app

echo [1/5] Installing dependencies...
call npm install

echo.
echo [2/5] Building React app...
call npm run build:win

echo.
echo [3/5] Initializing Capacitor (if needed)...
if not exist "android" (
    echo Initializing Capacitor...
    call npx cap init "Zyea+" "com.zyea.facebook" --web-dir=build
    echo Adding Android platform...
    call npx cap add android
) else (
    echo Capacitor already initialized
)

echo.
echo [4/5] Syncing Capacitor...
call npx cap sync android

echo.
echo [5/5] Opening Android Studio...
call npx cap open android

echo.
echo ===================================
echo   BUILD COMPLETE!
echo ===================================
echo.
echo Next steps:
echo 1. In Android Studio, build the APK
echo 2. Install on device
echo 3. Make sure Messenger app is also installed
echo.
pause

