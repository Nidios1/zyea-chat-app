@echo off
echo ===================================
echo   PUSH CODE TO GITHUB
echo ===================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo [Step 1/4] Initializing Git repository...
    git init
    echo.
) else (
    echo [Info] Git repository already initialized
    echo.
)

REM Add all files
echo [Step 2/4] Adding all files...
git add .
echo.

REM Prompt for commit message
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=Update: Add Zyea+ apps

echo.
echo [Step 3/4] Committing changes...
git commit -m "%commit_message%"
echo.

REM Check if remote exists
git remote -v | findstr "origin" >nul
if %errorlevel% neq 0 (
    echo [Step 4/4] Setting up remote...
    echo.
    echo IMPORTANT: Create a new repository on GitHub first!
    echo Then enter your repository URL below:
    echo Example: https://github.com/YOUR_USERNAME/zyea-plus-social-network.git
    echo.
    set /p repo_url="Enter GitHub repository URL: "
    
    git remote add origin !repo_url!
    git branch -M main
    git push -u origin main
) else (
    echo [Step 4/4] Pushing to GitHub...
    git push origin main
)

echo.
echo ===================================
echo   PUSH COMPLETE!
echo ===================================
echo.
echo Next steps:
echo 1. Go to your GitHub repository
echo 2. Setup Codemagic for iOS build: https://codemagic.io
echo 3. Or use GitHub Actions (check .github/workflows/)
echo.
pause

