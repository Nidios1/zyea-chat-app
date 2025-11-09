@echo off
REM Script để publish OTA updates cho Expo (Windows)
REM 
REM Usage:
REM   publish-update.bat [branch] [message]
REM 
REM Examples:
REM   publish-update.bat production "Fix bug login"
REM   publish-update.bat preview "Test new feature"
REM 
REM Environment Variables:
REM   EXPO_TOKEN - Expo access token (KHÔNG CẦN EMAIL khi chạy)
REM                Lấy từ: https://expo.dev/accounts/[username]/settings/access-tokens

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

REM Kiểm tra EXPO_TOKEN
if "%EXPO_TOKEN%"=="" (
    echo [ERROR] EXPO_TOKEN không được tìm thấy!
    echo.
    echo Cách lấy EXPO_TOKEN (KHÔNG CẦN EMAIL KHI CHẠY):
    echo   1. Truy cập: https://expo.dev/accounts/[username]/settings/access-tokens
    echo   2. Tạo token mới (nếu chưa có)
    echo   3. Set environment variable:
    echo      set EXPO_TOKEN=your-token-here
    echo.
    echo   4. Hoặc tạo file .env và thêm:
    echo      EXPO_TOKEN=your-token-here
    echo.
    echo LƯU Ý: Token này cho phép publish update KHÔNG CẦN nhập email mỗi lần!
    echo.
    pause
    exit /b 1
)

REM Check if EAS CLI is installed
where eas >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] EAS CLI is not installed or not in PATH
    echo Please install: npm install -g eas-cli
    pause
    exit /b 1
)

REM Publish update với --non-interactive để không hỏi email
echo [INFO] Publishing update...
echo [INFO] Using EXPO_TOKEN: %EXPO_TOKEN:~0,10%...
echo.
eas update --branch %BRANCH% --message "%MESSAGE%" --non-interactive

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
    echo Kiểm tra:
    echo   - EXPO_TOKEN có đúng không?
    echo   - Bạn đã login EAS chưa? (chỉ cần 1 lần: eas login)
    echo   - Project ID trong app.json có đúng không?
    echo.
    pause
    exit /b 1
)

pause

