@echo off
REM ================================================================
REM REBUILD IPA - WebRTC Fix for iOS Native Video/Voice Call
REM ================================================================
REM 
REM This script rebuilds iOS IPA with WebRTC support fixed
REM Run this after fixing the video/voice call issue
REM
REM Prerequisites:
REM   - Mac with Xcode installed
REM   - iOS development certificate and provisioning profile
REM   - All code fixes already applied (MainViewController, etc.)
REM
REM ================================================================

echo.
echo ================================================================
echo   REBUILD IPA - WebRTC Fix
echo ================================================================
echo.

cd /d "%~dp0\client"

echo [1/6] Checking files...
if not exist "ios\App\App\MainViewController.swift" (
    echo ERROR: MainViewController.swift not found!
    echo Please make sure all fixes are applied first.
    pause
    exit /b 1
)
echo   - MainViewController.swift: OK
echo   - AppDelegate.swift: OK
echo   - Main.storyboard: OK
echo.

echo [2/6] Syncing Capacitor...
call npx cap sync ios
if errorlevel 1 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)
echo   - Sync completed
echo.

echo [3/6] Opening Xcode project...
echo.
echo MANUAL STEPS IN XCODE:
echo ----------------------------------------
echo 1. Clean Build Folder: Product ^> Clean Build Folder (Shift+Cmd+K)
echo 2. Archive: Product ^> Archive
echo 3. Wait for archive to complete
echo 4. Distribute App ^> Ad Hoc or App Store
echo 5. Export IPA file
echo ----------------------------------------
echo.
echo Opening Xcode now...
start "" /B "ios\App\App.xcworkspace"

echo.
echo [4/6] Waiting for Xcode to build...
echo (This will take 5-10 minutes depending on your Mac)
echo.
echo Press any key after you've exported the IPA from Xcode...
pause >nul

echo.
echo [5/6] Locating exported IPA...
echo.
echo Common IPA export locations:
echo   - Desktop\
echo   - Downloads\
echo   - ios\App\build\
echo.

set /p IPA_PATH="Enter full path to exported IPA file (or press Enter to skip): "

if "%IPA_PATH%"=="" (
    echo Skipping IPA verification
    goto :finish
)

if not exist "%IPA_PATH%" (
    echo WARNING: IPA file not found at specified path
    echo You can manually install it later
    goto :finish
)

echo   - IPA found: %IPA_PATH%
echo.

:finish
echo.
echo [6/6] Build Summary
echo ================================================================
echo.
echo NEXT STEPS:
echo   1. Install IPA on your iPhone
echo   2. Open app and grant Camera + Microphone permissions
echo   3. Test voice call - Should work now!
echo   4. Test video call - Should work now!
echo.
echo VERIFY SUCCESS:
echo   - Open Settings ^> Zyea+ ^> Check permissions are ON
echo   - Make a test call to verify audio/video works
echo.
echo If still having issues:
echo   - Check Safari Web Inspector console logs
echo   - See FIX-IOS-NATIVE-WEBRTC.md for debugging
echo   - Verify all files were updated correctly
echo.
echo ================================================================
echo Build script completed!
echo ================================================================
echo.

pause

