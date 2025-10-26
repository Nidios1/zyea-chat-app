@echo off
echo ============================================
echo  Zyea+ App - API Configuration Setup
echo ============================================
echo.

echo Ban dang muon cau hinh backend API cho app:
echo.
echo 1. Backend da deploy tren server (Render/Railway/VPS)
echo 2. Test nhanh voi ngrok (can cai ngrok truoc)
echo 3. Su dung IP local trong mang LAN
echo.

set /p choice="Chon option (1/2/3): "

if "%choice%"=="1" goto server
if "%choice%"=="2" goto ngrok
if "%choice%"=="3" goto local
goto invalid

:server
echo.
echo Nhap URL cua backend server (khong co /api o cuoi):
echo Vi du: https://zyea-backend.onrender.com
set /p backend_url="URL: "

if "%backend_url%"=="" (
    echo Loi: URL khong duoc de trong!
    pause
    exit /b 1
)

echo.
echo Dang tao file .env.production...
(
    echo REACT_APP_API_URL=%backend_url%/api
    echo REACT_APP_SOCKET_URL=%backend_url%
) > .env.production

echo.
echo ============================================
echo  Hoan thanh!
echo ============================================
echo.
echo File .env.production da duoc tao voi cau hinh:
echo - API URL: %backend_url%/api
echo - Socket URL: %backend_url%
echo.
echo Buoc tiep theo:
echo 1. Push code len GitHub
echo 2. Chay workflow de build IPA moi
echo 3. Download va cai dat IPA moi
echo.
pause
exit /b 0

:ngrok
echo.
echo Dang su dung ngrok...
echo.
echo 1. Dam bao backend dang chay tren localhost:5000
echo 2. Mo terminal khac va chay: ngrok http 5000
echo 3. Copy URL tu ngrok (vi du: https://abc123.ngrok.io)
echo.
set /p ngrok_url="Nhap ngrok URL: "

if "%ngrok_url%"=="" (
    echo Loi: URL khong duoc de trong!
    pause
    exit /b 1
)

echo.
echo Dang tao file .env.production...
(
    echo REACT_APP_API_URL=%ngrok_url%/api
    echo REACT_APP_SOCKET_URL=%ngrok_url%
) > .env.production

echo.
echo ============================================
echo  Hoan thanh!
echo ============================================
echo.
echo File .env.production da duoc tao voi cau hinh:
echo - API URL: %ngrok_url%/api
echo - Socket URL: %ngrok_url%
echo.
echo LUU Y: ngrok URL se thay doi moi khi restart!
echo.
pause
exit /b 0

:local
echo.
echo Nhap IP local cua may chay backend:
echo - Kiem tra IP bang lenh: ipconfig
echo - Tim dong IPv4 Address (vi du: 192.168.1.100)
echo - Dam bao iPhone va may tinh cung mang WiFi
echo.
set /p local_ip="Nhap IP (vi du: 192.168.1.100): "

if "%local_ip%"=="" (
    echo Loi: IP khong duoc de trong!
    pause
    exit /b 1
)

echo.
echo Dang tao file .env.production...
(
    echo REACT_APP_API_URL=http://%local_ip%:5000/api
    echo REACT_APP_SOCKET_URL=http://%local_ip%:5000
) > .env.production

echo.
echo ============================================
echo  Hoan thanh!
echo ============================================
echo.
echo File .env.production da duoc tao voi cau hinh:
echo - API URL: http://%local_ip%:5000/api
echo - Socket URL: http://%local_ip%:5000
echo.
echo LUU Y:
echo - Dam bao backend dang chay
echo - Dam bao iPhone va may tinh cung mang WiFi
echo - Kiem tra firewall khong block port 5000
echo.
pause
exit /b 0

:invalid
echo.
echo Lua chon khong hop le!
pause
exit /b 1

