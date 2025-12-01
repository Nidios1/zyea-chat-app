@echo off
echo ========================================
echo Building iOS IPA with Ad-hoc profile
echo ========================================
echo.

REM Set environment variable to skip fingerprint
set EAS_SKIP_AUTO_FINGERPRINT=1

echo Starting EAS Build...
echo.

REM Run the build command
call eas build --platform ios --profile adhoc --non-interactive

echo.
echo ========================================
echo Build process completed!
echo Check the output above for download link
echo ========================================
pause

