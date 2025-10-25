@echo off
cls
echo ========================================
echo   PROJECT CLEANUP - SAFE MODE
echo ========================================
echo.
echo Script nay se don dep du an, xoa cac file:
echo - Doc trung lap
echo - Test files
echo - Build artifacts (co the rebuild)
echo - Temp files
echo.
echo CAC FILE QUAN TRONG SE DUOC GIU LAI!
echo.
pause

echo.
echo [1/6] Xoa Documentation trung lap...
if exist "APPLY-RESPONSIVE-TO-COMPONENTS.md" (
    del "APPLY-RESPONSIVE-TO-COMPONENTS.md"
    echo   ✓ Xoa APPLY-RESPONSIVE-TO-COMPONENTS.md
)
if exist "IOS-NATIVE-RESPONSIVE-COMPLETE.md" (
    del "IOS-NATIVE-RESPONSIVE-COMPLETE.md"
    echo   ✓ Xoa IOS-NATIVE-RESPONSIVE-COMPLETE.md
)
if exist "TEST-RESPONSIVE-CHECKLIST.md" (
    del "TEST-RESPONSIVE-CHECKLIST.md"
    echo   ✓ Xoa TEST-RESPONSIVE-CHECKLIST.md
)
if exist "BUILD-IOS-RESPONSIVE.bat" (
    del "BUILD-IOS-RESPONSIVE.bat"
    echo   ✓ Xoa BUILD-IOS-RESPONSIVE.bat
)
echo   Done!

echo.
echo [2/6] Xoa Test scripts...
if exist "test-*.js" del "test-*.js" 2>nul
if exist "demo-*.bat" del "demo-*.bat" 2>nul
if exist "quick-test-*.bat" del "quick-test-*.bat" 2>nul
if exist "fix-badge-auto.bat" del "fix-badge-auto.bat" 2>nul
if exist "quick-fix-live-update.bat" del "quick-fix-live-update.bat" 2>nul
echo   Done!

echo.
echo [3/6] Xoa Build artifacts...
if exist "client\build" (
    echo   Xoa client/build folder...
    rmdir /s /q "client\build" 2>nul
)
if exist "*.zip" (
    echo   Xoa *.zip files...
    del "*.zip" 2>nul
)
if exist "*.rar" (
    echo   Xoa *.rar files...
    del "*.rar" 2>nul
)
if exist "app-update.zip" del "app-update.zip" 2>nul
if exist "client\app-update.zip" del "client\app-update.zip" 2>nul
if exist "client\build.zip" del "client\build.zip" 2>nul
echo   Done!

echo.
echo [4/6] Xoa Temp files...
if exist "*.log" del "*.log" 2>nul
if exist "*.tmp" del "*.tmp" 2>nul
if exist "client\*.log" del "client\*.log" 2>nul
if exist "server\*.log" del "server\*.log" 2>nul
echo   Done!

echo.
echo [5/6] Xoa node_modules (Optional - can reinstall)...
set /p delete_nm="Xoa node_modules? (Y/N): "
if /i "%delete_nm%"=="Y" (
    echo   Xoa client/node_modules...
    rmdir /s /q "client\node_modules" 2>nul
    echo   Xoa server/node_modules...
    rmdir /s /q "server\node_modules" 2>nul
    echo   Xoa root/node_modules...
    rmdir /s /q "node_modules" 2>nul
    echo   ✓ Done! Can npm install lai
) else (
    echo   Skipped!
)

echo.
echo [6/6] Kiem tra file quan trong...
echo   Checking critical files...
if not exist "client\src\styles\mobile-responsive-master.css" (
    echo   ❌ ERROR: mobile-responsive-master.css MISSING!
    goto error
)
if not exist "client\src\hooks\useMobileLayout.js" (
    echo   ❌ ERROR: useMobileLayout.js MISSING!
    goto error
)
if not exist "client\src\utils\initMobileLayout.js" (
    echo   ❌ ERROR: initMobileLayout.js MISSING!
    goto error
)
if not exist "client\package.json" (
    echo   ❌ ERROR: package.json MISSING!
    goto error
)
if not exist "client\capacitor.config.ts" (
    echo   ❌ ERROR: capacitor.config.ts MISSING!
    goto error
)
echo   ✓ All critical files OK!

echo.
echo ========================================
echo   CLEANUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Da xoa:
echo - Documentation trung lap
echo - Test scripts
echo - Build artifacts
echo - Temp files
echo.
echo Da giu lai:
echo ✓ mobile-responsive-master.css
echo ✓ useMobileLayout.js
echo ✓ initMobileLayout.js
echo ✓ All components
echo ✓ All configs
echo ✓ iOS project
echo ✓ Assets
echo.
if /i "%delete_nm%"=="Y" (
    echo Next step: Chay "npm install" trong client va server
)
echo.
echo Can test: BUILD-TEST-MOBILE.bat
echo.
goto end

:error
echo.
echo ========================================
echo   ERROR: CRITICAL FILE MISSING!
echo ========================================
echo.
echo Mot so file quan trong bi xoa!
echo Hay restore tu backup hoac git.
echo.
pause
exit /b 1

:end
pause

