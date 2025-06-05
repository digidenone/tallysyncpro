@echo off
echo Starting TallySyncPro Backend Service...
echo.
echo This service will run on http://localhost:9000
echo It enables communication between the cloud frontend and Tally ERP
echo.
echo IMPORTANT: 
echo - Ensure Tally ERP is running with ODBC enabled
echo - Go to Gateway of Tally → F11 (Features) → Set "Use ODBC" to Yes
echo - Restart Tally after enabling ODBC
echo.
echo Starting service...

cd /d "%~dp0"

REM Set environment variables for proper CORS
set CORS_ORIGIN=http://localhost:5173,http://localhost:8080,https://tallysync.vercel.app,https://tallysync-git-main-digidenone.vercel.app,https://tallysync-digidenone.vercel.app
set PORT=9000
set NODE_ENV=production

REM Start the service
if exist "TallySyncPro.exe" (
    echo Starting TallySyncPro.exe...
    TallySyncPro.exe
) else if exist "backend\TallySyncPro.exe" (
    echo Starting backend\TallySyncPro.exe...
    backend\TallySyncPro.exe
) else (
    echo ERROR: TallySyncPro.exe not found!
    echo Please ensure the executable is in the same folder as this script.
    pause
    exit /b 1
)

echo.
echo TallySyncPro Backend Service started successfully!
echo You can now use the web interface at https://tallysync.vercel.app/
echo.
echo Press any key to stop the service...
pause > nul

echo Stopping service...
taskkill /f /im TallySyncPro.exe 2>nul
echo Service stopped.
pause
