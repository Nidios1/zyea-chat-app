@echo off
REM Script build IPA cho iOS (unsigned - de tu ky qua Esign)
REM Chạy script này trên Windows để build IPA bằng EAS

echo ============================================
echo    BUILD IPA FOR iOS - ZYEA MOBILE APP
echo    (Unsigned - Tu ky qua Esign)
echo ============================================
echo.

REM Kiểm tra EAS CLI đã cài chưa
where eas >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] EAS CLI chua duoc cai dat!
    echo Dang cai dat EAS CLI...
    npm install -g eas-cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Khong the cai dat EAS CLI
        pause
        exit /b 1
    )
)

echo [OK] EAS CLI da san sang
echo.

REM Kiểm tra đã login chưa
echo Kiem tra dang nhap EAS...
eas whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Chua dang nhap, dang dang nhap vao EAS...
    eas login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Dang nhap that bai
        pause
        exit /b 1
    )
    echo.
    echo [OK] Da dang nhap thanh cong
) else (
    echo [OK] Da dang nhap roi
)

echo.

REM Build IPA
echo ============================================
echo   BAT DAU BUILD IPA...
echo ============================================
echo.
echo Lua chon profile build:
echo   1. unsigned - IPA khong ky (KHUYEN NGHI cho Esign)
echo   2. adhoc     - Build cho ca nhan
echo   3. preview   - Build de test
echo   4. production - Build chinh thuc
echo.
set /p profile="Nhap so (1-4): "

if "%profile%"=="1" (
    set build_profile=unsigned
    set build_note=IPA khong ky - su dung Esign de tu ky
) else if "%profile%"=="2" (
    set build_profile=adhoc
    set build_note=IPA cho ca nhan
) else if "%profile%"=="3" (
    set build_profile=preview
    set build_note=IPA de test
) else if "%profile%"=="4" (
    set build_profile=production
    set build_note=IPA chinh thuc
) else (
    echo Lua chon khong hop le, dung mac dinh la 'unsigned'
    set build_profile=unsigned
    set build_note=IPA khong ky - su dung Esign de tu ky
)

echo.
echo ============================================
echo Build profile: %build_profile%
echo Note: %build_note%
echo ============================================
echo.

REM Chạy build
echo Dang bat dau build...
echo (Qua trinh build co the mat 15-30 phut)
echo.
set EAS_NO_VCS=1
eas build --platform ios --profile %build_profile% --non-interactive

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build that bai!
    echo Kiem tra log tren de xem loi chi tiet
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD THANH CONG!
echo ============================================
echo.
echo Ban co the tai file IPA ve tu:
echo https://expo.dev/accounts/hieukka/projects/zyea-mobile/builds
echo.
if "%build_profile%"=="unsigned" (
    echo ============================================
    echo HUONG DAN TU KY VOI ESIGN:
    echo ============================================
    echo 1. Tai file IPA ve may tinh
    echo 2. Mo ung dung Esign tren iPhone
    echo 3. Upload file IPA vao Esign
    echo 4. Nhan "Sign and Install" de tu ky va cai dat
    echo 5. Hoac su dung Sideloadly de ky va cai dat
    echo.
) else (
    echo Sau do su dung Esign hoac Sideloadly de:
    echo 1. Ky file IPA (neu can)
    echo 2. Cai dat len iPhone
    echo.
)
pause

