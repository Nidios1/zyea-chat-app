@echo off
echo.
echo ===================================================
echo   QUICK FIX: LIVE UPDATE FOR IPA
echo ===================================================
echo.

echo [INFO] This script will:
echo   1. Install capacitor-updater plugin
echo   2. Show you the new code to copy
echo   3. Sync with iOS
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo [STEP 1/4] Installing capacitor-updater plugin...
cd client
call npm install capacitor-updater
if errorlevel 1 (
  echo ❌ Failed to install plugin
  goto :error
)
echo ✅ Plugin installed

echo.
echo [STEP 2/4] Syncing with iOS...
call npx cap sync ios
if errorlevel 1 (
  echo ❌ Failed to sync
  goto :error
)
echo ✅ Synced with iOS

echo.
echo [STEP 3/4] Building app...
call npm run build
if errorlevel 1 (
  echo ❌ Build failed
  goto :error
)
echo ✅ Build completed

echo.
echo [STEP 4/4] Creating build.zip...
cd ..
powershell -Command "Compress-Archive -Path client\build\* -DestinationPath client\build.zip -Force"
if errorlevel 1 (
  echo ❌ Failed to create zip
  goto :error
)
echo ✅ build.zip created

echo.
echo ===================================================
echo   ✅ INSTALLATION COMPLETE!
echo ===================================================
echo.
echo NEXT STEPS:
echo.
echo 1. UPDATE CODE:
echo    Open: client\src\utils\liveUpdate.js
echo    Copy new code from: IMPLEMENT-LIVE-UPDATE-FIX.md
echo.
echo 2. UPDATE CONFIG (optional):
echo    Open: client\capacitor.config.ts
echo    Add CapacitorUpdater config (see guide)
echo.
echo 3. REBUILD IPA:
echo    npx cap open ios
echo    Xcode: Product → Clean → Archive → Export
echo.
echo 4. TEST ON IPHONE:
echo    Install new IPA → Test update flow
echo.
echo 📚 READ FULL GUIDE: IMPLEMENT-LIVE-UPDATE-FIX.md
echo.
goto :end

:error
echo.
echo ❌ ERROR OCCURRED!
echo.
echo Please check the error above and:
echo   1. Make sure you're in the right directory
echo   2. Check internet connection
echo   3. Try running commands manually
echo.
pause
exit /b 1

:end
echo Press any key to exit...
pause >nul

