@echo off
echo ==========================================
echo    QUICK FIX - SERVICE WORKER ERROR
echo ==========================================
echo.
echo Lỗi: ServiceWorker không thể update
echo Giải pháp: Mở trang xóa cache
echo.
echo Đang mở trang clear-cache...
echo.

start http://192.168.0.102:3000/clear-cache.html

echo.
echo ==========================================
echo    HƯỚNG DẪN SỬA LỖI:
echo ==========================================
echo.
echo 1. Trang clear-cache sẽ mở trong browser
echo 2. Click nút "Xóa Tất Cả (Full Reset)"
echo 3. Đợi 2 giây, trang sẽ tự động reload
echo 4. Đăng nhập lại
echo.
echo HOẶC FIX THỦ CÔNG TRONG CHROME:
echo 1. Nhấn F12 để mở DevTools
echo 2. Chọn tab "Application"
echo 3. Click "Service Workers" bên trái
echo 4. Click "Unregister" cho mỗi Service Worker
echo 5. Click "Clear storage" và click "Clear site data"
echo 6. Refresh trang (F5)
echo.
echo ==========================================
pause

