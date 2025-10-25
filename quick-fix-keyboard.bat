@echo off
echo ========================================
echo 🔧 QUICK FIX: Keyboard Native Issue
echo ========================================
echo.

cd client

echo 📦 Checking Capacitor Keyboard plugin...
call npm ls @capacitor/keyboard
if %errorlevel% neq 0 (
    echo.
    echo ❌ Keyboard plugin not found! Installing...
    call npm install @capacitor/keyboard
)

echo.
echo 🔨 Building React app...
call npm run build:win

echo.
echo 📱 Syncing to iOS...
call npx cap sync ios

echo.
echo ========================================
echo ✅ FIX COMPLETED!
echo ========================================
echo.
echo Next steps:
echo 1. Open Xcode: npx cap open ios
echo 2. Run on simulator/device
echo 3. Test keyboard in chat
echo.
echo Expected:
echo ✅ Tap input → Keyboard opens → Input moves up
echo ✅ Can see input field while typing
echo ✅ Smooth animation
echo.
echo 📖 Read FIX-KEYBOARD-NATIVE.md for details
echo.
pause

