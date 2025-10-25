@echo off
cls
echo ========================================
echo   BUILD ^& TEST MOBILE RESPONSIVE
echo ========================================
echo.
echo Đang build app với hệ thống responsive mới...
echo.

cd client

echo [1/4] Build React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo ✅ Build complete!
echo.

echo [2/4] Sync Capacitor iOS...
call npx cap sync ios
if %errorlevel% neq 0 (
    echo ERROR: Sync failed!
    pause
    exit /b 1
)
echo ✅ Sync complete!
echo.

echo [3/4] Copy assets...
call npx cap copy ios
echo ✅ Assets copied!
echo.

echo [4/4] Opening Xcode...
call npx cap open ios

echo.
echo ========================================
echo   BUILD COMPLETED!
echo ========================================
echo.
echo Next steps:
echo 1. Wait for Xcode to open
echo 2. Select device/simulator:
echo    - iPhone SE (test small screen)
echo    - iPhone 15 (test regular)
echo    - iPhone 15 Pro Max (test large)
echo 3. Click Run (Cmd+R)
echo 4. Test all features
echo.
echo ========================================

pause

