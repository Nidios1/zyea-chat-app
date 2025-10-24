@echo off
echo ================================================
echo 🧪 QUICK TEST LIVE UPDATE
echo ================================================
echo.
echo 📋 Current Setup:
echo    Client Version: 1.0.6
echo    Server Version: 1.0.7
echo    Update Available: YES
echo.
echo 🎯 Test Feature: Version Badge
echo    Location: Bottom right corner
echo    BEFORE: 🚀 v1.0.6 LIVE
echo    AFTER:  🚀 v1.0.7 LIVE
echo.
echo ================================================
echo.
echo 🚀 Starting server in 3 seconds...
timeout /t 3 /nobreak > nul

cd server
start cmd /k "echo 🌐 Server running on http://192.168.0.102:5000 && npm start"

echo.
echo ✅ Server started!
echo.
echo 📱 Now open your browser:
echo    http://localhost:3000
echo    or
echo    http://192.168.0.102:3000
echo.
echo 👀 Look for:
echo    1. Version Badge at bottom right: 🚀 v1.0.6 LIVE
echo    2. Wait 30s or reload page
echo    3. Update popup appears
echo    4. Click "Cập nhật"
echo    5. Watch Console logs
echo    6. Version Badge changes to: 🚀 v1.0.7 LIVE
echo.
echo ================================================
echo 🎉 Test successful if badge shows v1.0.7!
echo ================================================
pause

