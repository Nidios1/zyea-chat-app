@echo off
REM Script thiết lập Git remote repository
REM Liên kết với GitHub: https://github.com/Nidios1/zyea-chat-app.git

echo ============================================
echo    SETUP GIT REMOTE REPOSITORY
echo    ZYEA MOBILE APP
echo ============================================
echo.

REM Kiểm tra Git
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git chua duoc cai dat!
    echo Vui long cai dat Git truoc: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git da san sang
echo.

REM Kiểm tra đang ở đúng thư mục
if not exist "package.json" (
    echo [ERROR] Khong tim thay package.json
    echo Vui long chay script nay trong thu muc mobile-expo
    pause
    exit /b 1
)

REM Kiểm tra git repository
git status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Khong phai git repository, dang khoi tao...
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Khong the khoi tao git repository
        pause
        exit /b 1
    )
    echo [OK] Da khoi tao git repository
    echo.
)

REM Thiết lập remote
set GITHUB_URL=https://github.com/Nidios1/zyea-chat-app.git

echo ============================================
echo Kiem tra remote repository...
echo ============================================
echo.

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Remote 'origin' da ton tai:
    git remote get-url origin
    echo.
    set /p update_remote="Ban co muon cap nhat remote? (y/n): "
    if /i "%update_remote%"=="y" (
        git remote set-url origin %GITHUB_URL%
        echo [OK] Da cap nhat remote origin
    ) else (
        echo [INFO] Giu nguyen remote hien tai
    )
) else (
    echo Remote 'origin' chua ton tai, dang them...
    git remote add origin %GITHUB_URL%
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Khong the them remote repository
        pause
        exit /b 1
    )
    echo [OK] Da them remote origin: %GITHUB_URL%
)

echo.
echo ============================================
echo Thong tin remote repository:
echo ============================================
git remote -v
echo.

REM Kiểm tra branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set current_branch=%%i
if "%current_branch%"=="" (
    echo [INFO] Chua co branch nao, dang tao branch main...
    git branch -M main
    set current_branch=main
)

echo [OK] Branch hien tai: %current_branch%
echo.

REM Kiểm tra có file để commit không
git status --short >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Co cac file chua duoc commit
    echo.
    set /p initial_commit="Ban co muon commit va push lan dau? (y/n): "
    if /i "%initial_commit%"=="y" (
        echo.
        echo Dang them cac file...
        git add .
        
        echo Dang commit...
        git commit -m "Initial commit: Setup mobile-expo project"
        
        echo.
        echo Dang push len GitHub...
        git push -u origin %current_branch%
        
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo [OK] Da push thanh cong len GitHub!
        ) else (
            echo.
            echo [WARNING] Push that bai, co the do:
            echo - Repository chua duoc tao tren GitHub
            echo - Chua dang nhap GitHub
            echo - Khong co quyen push
            echo.
            echo Vui long:
            echo 1. Tao repository tren GitHub: %GITHUB_URL%
            echo 2. Hoac dang nhap GitHub: git config --global user.name "Your Name"
            echo 3. Hoac su dung Personal Access Token
        )
    )
)

echo.
echo ============================================
echo   SETUP HOAN TAT!
echo ============================================
echo.
echo Remote repository: %GITHUB_URL%
echo Branch: %current_branch%
echo.
echo De commit va push code sau nay, chay:
echo   commit-and-push.bat
echo   hoac
echo   npm run commit:push
echo.
pause

