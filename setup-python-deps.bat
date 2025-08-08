@echo off
REM TallySyncPro - Python Dependencies Setup Script
REM This script installs the required Python packages for pyodbc fallback

echo ============================================
echo TallySyncPro Python Dependencies Setup
echo ============================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.7+ first.
    echo Download from: https://www.python.org/downloads/
    echo.
    echo After installing Python, run this script again.
    pause
    exit /b 1
)

echo Python found:
python --version
echo.

REM Check if pip is available
pip --version >nul 2>&1
if errorlevel 1 (
    echo pip not found. Please ensure pip is installed with Python.
    pause
    exit /b 1
)

echo pip found:
pip --version
echo.

echo Installing Python dependencies...
echo.

REM Install pyodbc
echo Installing pyodbc (ODBC connectivity)...
pip install pyodbc>=4.0.0

if errorlevel 1 (
    echo.
    echo Warning: pyodbc installation failed.
    echo This may be due to missing Microsoft Visual C++ build tools.
    echo.
    echo Solutions:
    echo 1. Install Microsoft C++ Build Tools from:
    echo    https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo.
    echo 2. Or try installing with conda if you have Anaconda:
    echo    conda install pyodbc
    echo.
    echo 3. For 32-bit systems, you may need to use:
    echo    pip install pyodbc --force-reinstall --no-deps
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo Python dependencies installed successfully!
echo ============================================
echo.

REM Test the installation
echo Testing pyodbc installation...
python -c "import pyodbc; print('pyodbc version:', pyodbc.version)" 2>nul
if errorlevel 1 (
    echo Warning: pyodbc import test failed.
    echo The installation may not be complete.
) else (
    echo pyodbc is working correctly.
)

echo.
echo Setup complete! TallySyncPro can now use pyodbc as a fallback.
echo.
pause