@echo off
echo.
echo ============================================
echo   FIX: BADGE v1.1.x LIVE STILL SHOWING
echo ============================================
echo.

echo [STEP 1/5] Check current build...
cd client
if exist build.zip (
  echo ✅ Found build.zip
  for %%A in (build.zip) do echo    Size: %%~zA bytes
  for %%A in (build.zip) do echo    Modified: %%~tA
) else (
  echo ❌ build.zip not found!
  goto :error
)

echo.
echo [STEP 2/5] Verify versions...
findstr "BASE_VERSION = " src\utils\liveUpdate.js | findstr "1.1.4"
if errorlevel 1 (
  echo ❌ Client version NOT 1.1.4!
  goto :error
)
echo ✅ Client version: 1.1.4

cd ..\server
findstr "APP_VERSION = " routes\app.js | findstr "1.1.4"
if errorlevel 1 (
  echo ❌ Server version NOT 1.1.4!
  goto :error
)
echo ✅ Server version: 1.1.4

echo.
echo [STEP 3/5] Check if badge removed from App.js...
cd ..\client
findstr "Version Badge" src\App.js >nul 2>&1
if not errorlevel 1 (
  echo ❌ Badge code STILL IN App.js!
  echo    Need to remove badge code first
  goto :error
)
echo ✅ Badge code removed from App.js

echo.
echo [STEP 4/5] All checks passed!
echo.
echo ============================================
echo   READY TO FIX BADGE ISSUE
echo ============================================
echo.
echo Next steps to fix badge on IPA:
echo.
echo 🥇 OPTION 1: DELETE APP ^& REINSTALL (FASTEST)
echo    1. Delete app from iPhone
echo    2. Xcode → Clean Build Folder
echo    3. Build new IPA
echo    4. Install IPA
echo    5. Open app
echo    → ✅ Badge GONE!
echo.
echo 🥈 OPTION 2: FORCE UPDATE (NO REBUILD)
echo    1. Connect iPhone → Safari Inspector
echo    2. Console:
echo       localStorage.clear()
echo       caches.keys().then(n =^> n.forEach(c =^> caches.delete(c)))
echo    3. Restart server: cd server ^& npm start
echo    4. Wait 30s → Update popup
echo    5. Click "Cập nhật"
echo    → ✅ Badge GONE!
echo.
echo 🥉 OPTION 3: MAJOR VERSION UPDATE
echo    1. Change version to 2.0.0 (client ^& server)
echo    2. Set mandatory: true
echo    3. Rebuild + zip
echo    4. Restart server
echo    → ✅ FORCE update, badge GONE!
echo.

echo ============================================
echo Want to start server now? (Y/N)
echo ============================================
set /p choice="> "
if /i "%choice%"=="Y" (
  cd ..\server
  echo Starting server...
  npm start
) else (
  echo.
  echo Manual restart: cd server ^& npm start
)

goto :end

:error
echo.
echo ❌ ERROR: Pre-flight checks failed!
echo.
echo Please fix the issues above and try again.
echo.
pause
exit /b 1

:end
echo.
echo ✅ Done!
pause

