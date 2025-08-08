@echo off
REM TallySyncPro - System Verification Script
REM This script verifies all components are properly configured

echo ============================================
echo TallySyncPro System Verification
echo ============================================
echo.

REM Check Node.js
echo [1/6] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found
    goto error
) else (
    echo ✅ Node.js found:
    node --version
)
echo.

REM Check npm
echo [2/6] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found
    goto error
) else (
    echo ✅ npm found:
    npm --version
)
echo.

REM Check Python
echo [3/6] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found
    echo Please install Python 3.7+ from https://www.python.org/downloads/
    goto error
) else (
    echo ✅ Python found:
    python --version
)
echo.

REM Check Python architecture
echo [4/6] Checking Python architecture...
python -c "import platform; print('Architecture:', platform.architecture()[0])" 2>nul
if errorlevel 1 (
    echo ❌ Failed to check Python architecture
) else (
    echo ✅ Python architecture verified
)
echo.

REM Check pyodbc
echo [5/6] Checking pyodbc installation...
python -c "import pyodbc; print('pyodbc version:', pyodbc.version)" >nul 2>&1
if errorlevel 1 (
    echo ❌ pyodbc not installed
    echo Run setup-python-deps.bat to install pyodbc
    goto warning
) else (
    echo ✅ pyodbc found:
    python -c "import pyodbc; print('pyodbc version:', pyodbc.version)"
)
echo.

REM Test TallySyncPro Python script
echo [6/6] Testing TallySyncPro Python integration...
python src\python\pyodbc_connector.py check >nul 2>&1
if errorlevel 1 (
    echo ❌ TallySyncPro Python script failed
    goto error
) else (
    echo ✅ TallySyncPro Python integration working
    echo Details:
    python src\python\pyodbc_connector.py check
)
echo.

echo ============================================
echo ✅ ALL CHECKS PASSED
echo ============================================
echo.
echo Your system is ready for TallySyncPro compilation!
echo.
echo Next steps:
echo 1. Run: npm run dist:win:32    (for 32-bit build)
echo 2. Run: npm run dist:win       (for 64-bit build)
echo 3. Run: npm run dist:win:all   (for both builds)
echo.
goto end

:warning
echo.
echo ============================================
echo ⚠️  WARNING: Some components missing
echo ============================================
echo.
echo Python is available but pyodbc is not installed.
echo This means only HTTP XML fallback will work.
echo.
echo To fix: Run setup-python-deps.bat
echo.
goto end

:error
echo.
echo ============================================
echo ❌ ERROR: Missing required components
echo ============================================
echo.
echo Please install the missing components and run this script again.
echo.

:end
pause