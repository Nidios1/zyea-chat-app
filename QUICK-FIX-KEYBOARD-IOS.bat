@echo off
echo ========================================
echo QUICK FIX: iOS Keyboard Issue
echo ========================================
echo.

echo [1/5] Building React app...
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/5] Syncing Capacitor iOS...
call npx cap sync ios
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo [3/5] Configuring iOS Info.plist...
call node configure-ios-info-plist.js

echo.
echo [4/5] Opening Xcode...
call npx cap open ios

echo.
echo ========================================
echo SUCCESS! Keyboard fix applied
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Wait for Xcode to open
echo 2. Select your iPhone or Simulator
echo 3. Click Run (CMD+R)
echo 4. Test: Tap message input - keyboard should NOT cover it
echo.
echo If still not working:
echo - Clean build folder in Xcode (CMD+SHIFT+K)
echo - Delete app from device and reinstall
echo - Check capacitor.config.ts: resize should be 'native'
echo.
pause

