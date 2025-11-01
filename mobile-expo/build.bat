@echo off
REM Script build ứng dụng cho development/web
REM Chạy script này để build và test ứng dụng

echo ============================================
echo    BUILD ZYEA MOBILE APP
echo ============================================
echo.

REM Kiểm tra Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js chua duoc cai dat!
    pause
    exit /b 1
)

echo [OK] Node.js da san sang
echo.

REM Kiểm tra dependencies
if not exist "node_modules\" (
    echo Dang cai dat dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Cai dat dependencies that bai!
        pause
        exit /b 1
    )
)

echo.
echo Lua chon che do build:
echo   1. Start development server
echo   2. Build web
echo   3. Run iOS simulator (can Mac)
echo.
set /p choice="Nhap so (1-3): "

if "%choice%"=="1" (
    echo.
    echo Khoi dong development server...
    echo.
    call npm start
) else if "%choice%"=="2" (
    echo.
    echo Build web...
    echo.
    call npm run web
) else if "%choice%"=="3" (
    echo.
    echo Chay iOS simulator...
    echo.
    call npm run ios
) else (
    echo.
    echo Lua chon khong hop le, khoi dong development server...
    echo.
    call npm start
)

pause

