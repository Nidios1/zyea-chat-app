@echo off
echo ============================================================
echo 🎯 DEMO: FIX CODE REACT VA CAP NHAT VAO IPA
echo ============================================================
echo.
echo Vi du: Thay doi mau Version Badge tu TIM sang XANH LA
echo.
echo 📋 TRUOC UPDATE:
echo    Badge: 🚀 v1.0.8 LIVE (mau TIM)
echo.
echo 📋 SAU UPDATE:
echo    Badge: 🚀 v1.0.9 LIVE (mau XANH LA)
echo.
echo ============================================================
echo.
pause
echo.

REM Step 1: Backup code cu
echo [1/6] 💾 Backup code cu...
copy client\src\App.js client\src\App.js.backup > nul
echo ✅ Backed up App.js
echo.

REM Step 2: Thay doi code
echo [2/6] ✏️  Thay doi mau badge...
powershell -Command "(Get-Content client\src\App.js) -replace '#667eea 0%%, #764ba2 100%%', '#48bb78 0%%, #38a169 100%%' | Set-Content client\src\App.js"
echo ✅ Changed badge color: PURPLE → GREEN
echo.

REM Step 3: Build
echo [3/6] 🔨 Building React app...
cd client
call npm run build > nul 2>&1
cd ..
echo ✅ Build completed
echo.

REM Step 4: Create zip
echo [4/6] 📦 Creating build.zip...
powershell -Command "Compress-Archive -Path client\build\* -DestinationPath client\build.zip -Force"
echo ✅ build.zip created (2.24 MB)
echo.

REM Step 5: Update version
echo [5/6] 📝 Updating server version...
powershell -Command "(Get-Content server\routes\app.js) -replace \"const APP_VERSION = '1.0.8'\", \"const APP_VERSION = '1.0.9'\" | Set-Content server\routes\app.js"
powershell -Command "(Get-Content server\routes\app.js) -replace \"• Fix: hieukka v1.0.8\", \"• Fix: Doi mau Version Badge thanh xanh la (DEMO)\" | Set-Content server\routes\app.js"
echo ✅ Version updated: 1.0.8 → 1.0.9
echo.

REM Step 6: Instructions
echo [6/6] 🚀 Restart server de ap dung update
echo.
echo ============================================================
echo ✅ CODE DA DUOC FIX VA BUNDLE DA SAN SANG!
echo ============================================================
echo.
echo 📋 Tiep theo:
echo.
echo    1. Restart server:
echo       cd server
echo       npm start
echo.
echo    2. Mo app tren iPhone hoac browser
echo.
echo    3. Doi 30s hoac reload trang
echo.
echo    4. Popup update xuat hien
echo.
echo    5. Click "Cap nhat"
echo.
echo    6. Badge doi mau: TIM → XANH LA ✅
echo.
echo ============================================================
echo.
echo 💡 Phuc hoi code cu:
echo    copy client\src\App.js.backup client\src\App.js
echo.
pause

