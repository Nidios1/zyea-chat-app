@echo off
echo ========================================
echo    KHOI DONG SERVER ZALO CLONE
echo ========================================
echo.

REM Kiểm tra Node.js có cài đặt không
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js chua duoc cai dat!
    echo Vui long cai dat Node.js truoc.
    pause
    exit /b 1
)

REM Kiểm tra MySQL/XAMPP có chạy không
echo [1/3] Kiem tra MySQL/XAMPP...
netstat -ano | findstr :3306 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MySQL co the chua chay!
    echo Vui long khoi dong XAMPP va start MySQL.
    echo.
)

REM Kiểm tra port 5000 có đang được sử dụng không
echo [2/3] Kiem tra port 5000...
netstat -ano | findstr :5000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 5000 dang duoc su dung!
    echo Co the server da chay roi.
    echo.
    choice /C YN /M "Ban co muon tiep tuc khong (Y/N)"
    if errorlevel 2 exit /b 0
    if errorlevel 1 goto :start
) else (
    echo [OK] Port 5000 san sang.
)

:start
REM Chuyển đến thư mục server
cd /d "%~dp0"

REM Kiểm tra node_modules
if not exist "node_modules" (
    echo [3/3] Cai dat dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Cai dat dependencies that bai!
        pause
        exit /b 1
    )
) else (
    echo [3/3] Dependencies da duoc cai dat.
)

echo.
echo ========================================
echo    DANG KHOI DONG SERVER...
echo ========================================
echo.
echo Server se chay tren: http://localhost:5000
echo Mobile app co the ket noi qua: http://[YOUR_IP]:5000
echo.
echo Nhan Ctrl+C de dung server.
echo.

REM Khởi động server
call npm start

pause

