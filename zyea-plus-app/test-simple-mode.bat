@echo off
echo ============================================
echo  Zyea+ - Test Simple Mode
echo ============================================
echo.

echo This script will:
echo 1. Backup current App.js
echo 2. Use simplified test version
echo 3. Build and sync
echo 4. You can test on GitHub Actions
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Backing up App.js...
copy src\App.js src\App.js.backup >nul 2>&1
if errorlevel 1 (
    echo Warning: Could not backup App.js
) else (
    echo ✅ Backed up to src\App.js.backup
)

echo.
echo Step 2: Using test simple version...
copy src\App.test-simple.js src\App.js >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Could not copy test version
    pause
    exit /b 1
)
echo ✅ Test version activated

echo.
echo Step 3: Building...
call npm run build:win
if errorlevel 1 (
    echo ❌ Build failed!
    echo.
    echo Restoring original App.js...
    copy src\App.js.backup src\App.js >nul 2>&1
    pause
    exit /b 1
)
echo ✅ Build complete

echo.
echo Step 4: Syncing with Capacitor...
call npx cap sync ios
echo ✅ Sync complete

echo.
echo ============================================
echo  Test Mode Activated!
echo ============================================
echo.
echo Next steps:
echo 1. Commit and push to GitHub:
echo    git add .
echo    git commit -m "Test: Simplified app for debugging"
echo    git push origin main
echo.
echo 2. Build IPA on GitHub Actions
echo 3. Install and test on iPhone
echo 4. If it works, the issue is in the original App.js
echo.
echo To restore original App.js:
echo    run: restore-original-app.bat
echo.
pause


echo ============================================
echo  Zyea+ - Test Simple Mode
echo ============================================
echo.

echo This script will:
echo 1. Backup current App.js
echo 2. Use simplified test version
echo 3. Build and sync
echo 4. You can test on GitHub Actions
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Backing up App.js...
copy src\App.js src\App.js.backup >nul 2>&1
if errorlevel 1 (
    echo Warning: Could not backup App.js
) else (
    echo ✅ Backed up to src\App.js.backup
)

echo.
echo Step 2: Using test simple version...
copy src\App.test-simple.js src\App.js >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Could not copy test version
    pause
    exit /b 1
)
echo ✅ Test version activated

echo.
echo Step 3: Building...
call npm run build:win
if errorlevel 1 (
    echo ❌ Build failed!
    echo.
    echo Restoring original App.js...
    copy src\App.js.backup src\App.js >nul 2>&1
    pause
    exit /b 1
)
echo ✅ Build complete

echo.
echo Step 4: Syncing with Capacitor...
call npx cap sync ios
echo ✅ Sync complete

echo.
echo ============================================
echo  Test Mode Activated!
echo ============================================
echo.
echo Next steps:
echo 1. Commit and push to GitHub:
echo    git add .
echo    git commit -m "Test: Simplified app for debugging"
echo    git push origin main
echo.
echo 2. Build IPA on GitHub Actions
echo 3. Install and test on iPhone
echo 4. If it works, the issue is in the original App.js
echo.
echo To restore original App.js:
echo    run: restore-original-app.bat
echo.
pause

