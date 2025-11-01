@echo off
echo ========================================
echo React Native Error Fixer
echo ========================================
echo.

echo [1/5] Fixing dependencies...
call npx expo install --fix
call npx expo install react-native-worklets
echo.

echo [2/5] Running expo-doctor...
call npx expo-doctor
echo.

echo [3/5] Scanning for boolean errors...
call node find-actual-boolean-errors.js
echo.

echo [4/5] Running TypeScript check...
call npx tsc --noEmit 2>&1 | head -30
echo.

echo [5/5] Clearing cache...
if exist node_modules\.expo rmdir /s /q node_modules\.expo
if exist .expo rmdir /s /q .expo
if exist .expo-shared rmdir /s /q .expo-shared
echo.

echo ========================================
echo Done! Now run: npx expo start --clear
echo ========================================
pause

