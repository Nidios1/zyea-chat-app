@echo off
REM Script commit và push code lên GitHub
REM Tự động commit và push các thay đổi

echo ============================================
echo    COMMIT & PUSH TO GITHUB
echo    ZYEA MOBILE APP
echo ============================================
echo.

REM Kiểm tra Git
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git chua duoc cai dat!
    echo.
    echo Vui long cai dat Git:
    echo 1. Truy cap: https://git-scm.com/download/win
    echo 2. Tai va cai dat Git for Windows
    echo 3. Chay lai script nay
    echo.
    echo HOAC cai dat GitHub CLI de su dung dang nhap tu browser:
    echo    winget install --id GitHub.cli
    echo    Sau do: gh auth login
    echo.
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
    echo [ERROR] Khong phai git repository!
    echo Khoi tao git repository...
    git init
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Khong the khoi tao git repository
        pause
        exit /b 1
    )
)

echo.
echo Kiem tra trang thai git...
git status --short
echo.

REM Kiểm tra có thay đổi không
git diff --quiet
if %ERRORLEVEL% EQU 0 (
    git diff --cached --quiet
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Khong co thay doi nao de commit
        echo.
        set /p push_anyway="Ban co muon push len GitHub khong? (y/n): "
        if /i not "%push_anyway%"=="y" (
            echo Da huy
            pause
            exit /b 0
        )
    )
)

echo.
echo Nhap thong tin commit:
echo.
set /p commit_message="Commit message (de trong se dung timestamp): "

if "%commit_message%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set commit_message=Update %datetime:~0,8%-%datetime:~8,6%
)

echo.
echo ============================================
echo Thong tin commit:
echo Message: %commit_message%
echo ============================================
echo.

REM Thêm tất cả file vào staging
echo Dang them cac file thay doi...
git add .

REM Commit
echo.
echo Dang commit...
git commit -m "%commit_message%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Commit that bai!
    pause
    exit /b 1
)

echo.
echo [OK] Commit thanh cong!
echo.

REM Kiểm tra remote
echo Kiem tra remote repository...
git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Chua co remote repository!
    echo Dang them remote repository mac dinh: https://github.com/Nidios1/zyea-chat-app.git
    set GITHUB_URL=https://github.com/Nidios1/zyea-chat-app.git
    git remote add origin %GITHUB_URL%
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Khong the them remote repository
        echo.
        echo Vui long chay: setup-git-remote.bat de cau hinh remote
        pause
        exit /b 1
    )
    echo [OK] Da them remote repository: %GITHUB_URL%
    echo.
) else (
    echo [OK] Remote repository da duoc cau hinh
    git remote get-url origin
)
echo.

REM Kiểm tra branch
for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do set current_branch=%%i
if "%current_branch%"=="" (
    set current_branch=main
    git branch -M %current_branch%
)

echo.
echo Branch hien tai: %current_branch%
echo.

REM Push
echo ============================================
echo   DANG PUSH LEN GITHUB...
echo ============================================
echo.

REM Thử push lần đầu
git push -u origin %current_branch% 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Thu push len remote...
    git push origin %current_branch% 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Push that bai!
        echo Co the do:
        echo - Chua dang nhap GitHub
        echo - Khong co quyen push
        echo - Network error
        echo.
        echo Thu chay: git push -u origin %current_branch%
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo   PUSH THANH CONG!
echo ============================================
echo.
echo Code da duoc push len GitHub thanh cong!
echo Branch: %current_branch%
echo Commit: %commit_message%
echo.
pause

