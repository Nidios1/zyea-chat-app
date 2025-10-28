@echo off
echo ============================================
echo   Push Code to GitHub - Zyea Chat App
echo ============================================
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    git init
    echo.
)

REM Add all files
echo Adding files to git...
git add .

REM Commit
echo.
echo Creating commit...
git commit -m "Add iOS build workflows and React Native migration"

REM Check if remote exists
git remote -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Adding remote repository...
    git remote add origin https://github.com/Nidios1/zyea-chat-app.git
)

REM Push
echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo   SUCCESS! Code pushed to GitHub!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Go to: https://github.com/Nidios1/zyea-chat-app
    echo 2. Click "Actions" tab
    echo 3. Wait for workflow to complete (~15-20 min)
    echo 4. Download IPA from Artifacts
    echo.
) else (
    echo.
    echo ============================================
    echo   Error pushing to GitHub
    echo ============================================
    echo.
    echo Please check:
    echo - GitHub repository exists
    echo - You have push permissions
    echo - Network connection
    echo.
)

pause

