@echo off
echo ========================================
echo   MESSAGE DELETION MIGRATION
echo ========================================
echo.
echo This will add the message_deletions table
echo to support proper "delete for me" functionality
echo.
echo Make sure you have backed up your database!
echo.
pause

cd server

echo.
echo Running migration...
node migration-add-message-deletions.js

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your server
echo 2. Test the delete message functionality
echo 3. Run test script: node ..\test-message-deletion.js
echo.
pause

