@echo off
REM Script để publish OTA updates cho Expo (Windows)
REM 
REM Usage:
REM   publish-update.bat [branch] [message]
REM 
REM Examples:
REM   publish-update.bat production "Fix bug login"
REM   publish-update.bat preview "Test new feature"

setlocal

set BRANCH=%1
set MESSAGE=%2

if "%BRANCH%"=="" set BRANCH=production
if "%MESSAGE%"=="" set MESSAGE=Update

echo.
echo ========================================
echo   Publishing OTA Update
echo ========================================
echo   Branch: %BRANCH%
echo   Message: %MESSAGE%
echo.

REM Check if EAS CLI is installed
where eas >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] EAS CLI is not installed or not in PATH
    echo Please install: npm install -g eas-cli
    pause
    exit /b 1
)

REM Publish update
echo [INFO] Publishing update...
eas update --branch %BRANCH% --message "%MESSAGE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Update published successfully!
    echo ========================================
    echo.
    echo Users will receive the update:
    echo   - Automatically on next app launch
    echo   - Or when app comes to foreground
    echo.
) else (
    echo.
    echo [ERROR] Failed to publish update
    echo.
    pause
    exit /b 1
)

pause

