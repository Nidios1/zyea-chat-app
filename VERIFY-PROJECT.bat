@echo off
cls
echo ========================================
echo   VERIFY PROJECT STRUCTURE
echo ========================================
echo.
echo Kiem tra cau truc du an va cac file quan trong...
echo.

set "errors=0"

echo [Checking Core Files...]
echo.

REM Mobile Responsive System
if exist "client\src\styles\mobile-responsive-master.css" (
    echo ✓ mobile-responsive-master.css
) else (
    echo ❌ mobile-responsive-master.css MISSING!
    set /a errors+=1
)

if exist "client\src\hooks\useMobileLayout.js" (
    echo ✓ useMobileLayout.js
) else (
    echo ❌ useMobileLayout.js MISSING!
    set /a errors+=1
)

if exist "client\src\utils\initMobileLayout.js" (
    echo ✓ initMobileLayout.js
) else (
    echo ❌ initMobileLayout.js MISSING!
    set /a errors+=1
)

echo.
echo [Checking Config Files...]
echo.

if exist "client\package.json" (
    echo ✓ client/package.json
) else (
    echo ❌ client/package.json MISSING!
    set /a errors+=1
)

if exist "client\capacitor.config.ts" (
    echo ✓ capacitor.config.ts
) else (
    echo ❌ capacitor.config.ts MISSING!
    set /a errors+=1
)

if exist "client\tailwind.config.js" (
    echo ✓ tailwind.config.js
) else (
    echo ❌ tailwind.config.js MISSING!
    set /a errors+=1
)

echo.
echo [Checking App Core...]
echo.

if exist "client\src\index.js" (
    echo ✓ index.js
) else (
    echo ❌ index.js MISSING!
    set /a errors+=1
)

if exist "client\src\App.js" (
    echo ✓ App.js
) else (
    echo ❌ App.js MISSING!
    set /a errors+=1
)

if exist "client\src\components" (
    echo ✓ components/ folder
) else (
    echo ❌ components/ folder MISSING!
    set /a errors+=1
)

if exist "client\src\hooks" (
    echo ✓ hooks/ folder
) else (
    echo ❌ hooks/ folder MISSING!
    set /a errors+=1
)

if exist "client\src\utils" (
    echo ✓ utils/ folder
) else (
    echo ❌ utils/ folder MISSING!
    set /a errors+=1
)

echo.
echo [Checking iOS Project...]
echo.

if exist "client\ios\App\App.xcodeproj" (
    echo ✓ iOS Xcode project
) else (
    echo ❌ iOS Xcode project MISSING!
    set /a errors+=1
)

if exist "client\ios\Podfile" (
    echo ✓ iOS Podfile
) else (
    echo ❌ iOS Podfile MISSING!
    set /a errors+=1
)

echo.
echo [Checking Assets...]
echo.

if exist "client\public\index.html" (
    echo ✓ index.html
) else (
    echo ❌ index.html MISSING!
    set /a errors+=1
)

if exist "client\public\manifest.json" (
    echo ✓ manifest.json
) else (
    echo ❌ manifest.json MISSING!
    set /a errors+=1
)

if exist "client\public\sw.js" (
    echo ✓ sw.js
) else (
    echo ❌ sw.js MISSING!
    set /a errors+=1
)

echo.
echo [Checking Server...]
echo.

if exist "server\index.js" (
    echo ✓ server/index.js
) else (
    echo ❌ server/index.js MISSING!
    set /a errors+=1
)

if exist "server\package.json" (
    echo ✓ server/package.json
) else (
    echo ❌ server/package.json MISSING!
    set /a errors+=1
)

echo.
echo [Checking Documentation...]
echo.

if exist "START-HERE-MOBILE-RESPONSIVE.md" (
    echo ✓ START-HERE-MOBILE-RESPONSIVE.md
) else (
    echo ⚠ START-HERE-MOBILE-RESPONSIVE.md missing (not critical)
)

if exist "MOBILE-RESPONSIVE-SIMPLE-GUIDE.md" (
    echo ✓ MOBILE-RESPONSIVE-SIMPLE-GUIDE.md
) else (
    echo ⚠ MOBILE-RESPONSIVE-SIMPLE-GUIDE.md missing (not critical)
)

if exist "BUILD-TEST-MOBILE.bat" (
    echo ✓ BUILD-TEST-MOBILE.bat
) else (
    echo ⚠ BUILD-TEST-MOBILE.bat missing (not critical)
)

echo.
echo ========================================

if %errors%==0 (
    echo   ✅ VERIFICATION PASSED!
    echo ========================================
    echo.
    echo Tat ca cac file quan trong deu co day!
    echo Du an san sang de build va test.
    echo.
    echo Next step: BUILD-TEST-MOBILE.bat
) else (
    echo   ❌ VERIFICATION FAILED!
    echo ========================================
    echo.
    echo Co %errors% file quan trong bi thieu!
    echo Hay restore tu backup hoac git.
)

echo.
pause

