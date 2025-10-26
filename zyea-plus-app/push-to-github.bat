@echo off
echo ============================================
echo  Push Zyea+ App to GitHub
echo ============================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    echo.
)

REM Check if remote exists
git remote -v | findstr "origin" > nul
if errorlevel 1 (
    echo Adding remote repository...
    git remote add origin https://github.com/Nidios1/zyea-plus-social-network.git
    echo.
) else (
    echo Remote repository already exists.
    echo.
)

REM Add all files
echo Adding files to git...
git add .
echo.

REM Commit changes
echo Enter commit message (or press Enter for default message):
set /p commit_msg="> "
if "%commit_msg%"=="" (
    set commit_msg=Update Zyea+ app
)

echo Committing changes...
git commit -m "%commit_msg%"
echo.

REM Push to GitHub
echo Pushing to GitHub...
echo Note: You may need to authenticate with GitHub
echo.

git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo ============================================
    echo  Push failed! Please check:
    echo  1. Your GitHub authentication
    echo  2. Repository URL is correct
    echo  3. You have permission to push
    echo ============================================
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Successfully pushed to GitHub!
echo  Repository: https://github.com/Nidios1/zyea-plus-social-network
echo ============================================
echo.
echo To build IPA on GitHub:
echo 1. Go to: https://github.com/Nidios1/zyea-plus-social-network/actions
echo 2. Select "Build Zyea+ iOS App" workflow
echo 3. Click "Run workflow"
echo 4. Choose build type and click "Run workflow"
echo 5. Wait for the build to complete
echo 6. Download the IPA from the artifacts
echo.
pause

