@echo off
setlocal enabledelayedexpansion
REM ================================================================
REM VERIFY iOS WebRTC Fix - Check all files are updated correctly
REM ================================================================

echo.
echo ================================================================
echo   VERIFY iOS WebRTC Fix
echo ================================================================
echo.

cd /d "%~dp0\client"

set ERROR_COUNT=0

echo [1/5] Checking MainViewController.swift...
if exist "ios\App\App\MainViewController.swift" (
    echo   [OK] MainViewController.swift exists
    findstr /C:"webViewConfiguration" "ios\App\App\MainViewController.swift" >nul
    if errorlevel 1 (
        echo   [ERROR] MainViewController.swift doesn't have webViewConfiguration method!
        set /a ERROR_COUNT+=1
    ) else (
        echo   [OK] webViewConfiguration method found
    )
) else (
    echo   [ERROR] MainViewController.swift NOT FOUND!
    set /a ERROR_COUNT+=1
)
echo.

echo [2/5] Checking Main.storyboard...
if exist "ios\App\App\Base.lproj\Main.storyboard" (
    echo   [OK] Main.storyboard exists
    findstr /C:"MainViewController" "ios\App\App\Base.lproj\Main.storyboard" >nul
    if errorlevel 1 (
        echo   [ERROR] Main.storyboard still uses CAPBridgeViewController!
        set /a ERROR_COUNT+=1
    ) else (
        echo   [OK] Main.storyboard uses MainViewController
    )
) else (
    echo   [ERROR] Main.storyboard NOT FOUND!
    set /a ERROR_COUNT+=1
)
echo.

echo [3/5] Checking AppDelegate.swift...
if exist "ios\App\App\AppDelegate.swift" (
    echo   [OK] AppDelegate.swift exists
    findstr /C:"AVAudioSession" "ios\App\App\AppDelegate.swift" >nul
    if errorlevel 1 (
        echo   [WARNING] AVAudioSession config might be missing
    ) else (
        echo   [OK] AVAudioSession config found
    )
) else (
    echo   [ERROR] AppDelegate.swift NOT FOUND!
    set /a ERROR_COUNT+=1
)
echo.

echo [4/5] Checking Info.plist permissions...
if exist "ios\App\App\Info.plist" (
    echo   [OK] Info.plist exists
    findstr /C:"NSCameraUsageDescription" "ios\App\App\Info.plist" >nul
    if errorlevel 1 (
        echo   [ERROR] NSCameraUsageDescription NOT FOUND!
        set /a ERROR_COUNT+=1
    ) else (
        echo   [OK] Camera permission description found
    )
    findstr /C:"NSMicrophoneUsageDescription" "ios\App\App\Info.plist" >nul
    if errorlevel 1 (
        echo   [ERROR] NSMicrophoneUsageDescription NOT FOUND!
        set /a ERROR_COUNT+=1
    ) else (
        echo   [OK] Microphone permission description found
    )
) else (
    echo   [ERROR] Info.plist NOT FOUND!
    set /a ERROR_COUNT+=1
)
echo.

echo [5/5] Checking capacitor.config.ts...
if exist "capacitor.config.ts" (
    echo   [OK] capacitor.config.ts exists
    findstr /C:"webViewMediaCaptureEnabled" "capacitor.config.ts" >nul
    if errorlevel 1 (
        echo   [WARNING] webViewMediaCaptureEnabled might be missing
    ) else (
        echo   [OK] webViewMediaCaptureEnabled found
    )
) else (
    echo   [ERROR] capacitor.config.ts NOT FOUND!
    set /a ERROR_COUNT+=1
)
echo.

echo ================================================================
echo   VERIFICATION SUMMARY
echo ================================================================
echo.

if !ERROR_COUNT!==0 (
    echo [SUCCESS] All checks passed!
    echo.
    echo Your iOS WebRTC fix is correctly applied.
    echo.
    echo NEXT STEPS:
    echo   1. Run: REBUILD-IPA-WEBRTC-FIX.bat
    echo   2. Or open Xcode and rebuild manually
    echo   3. Install new IPA on device
    echo   4. Test video/voice calls
    echo.
) else (
    echo [FAILED] Found !ERROR_COUNT! error^(s^)
    echo.
    echo Please check the errors above and fix them.
    echo.
    echo TROUBLESHOOTING:
    echo   - Make sure all files were updated correctly
    echo   - Re-apply fixes if needed
    echo   - See FIX-IOS-NATIVE-WEBRTC.md for details
    echo.
)

echo ================================================================
echo.

pause

