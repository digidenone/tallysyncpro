# TallySyncPro - 32-bit Setup and PyODBC Fallback Configuration

## Overview

TallySyncPro now supports:
1. **32-bit and 64-bit Windows builds** - Compatible with both architectures
2. **Triple-layer connection fallback** - Ensures maximum reliability
3. **PyODBC integration** - Python-based ODBC connectivity as fallback

## Connection Methods (In Order of Priority)

### 1. Primary: Node ODBC (node-odbc)
- Native Node.js ODBC connectivity
- Best performance and compatibility
- Direct integration with Electron

### 2. Secondary: Python ODBC (pyodbc) 
- Python-based ODBC fallback
- Activates when node-odbc fails or is unavailable
- Requires Python and pyodbc installation

### 3. Tertiary: HTTP XML
- Direct HTTP communication with Tally Gateway
- Last resort when ODBC methods fail
- Basic connectivity testing only

## 32-bit Configuration

The application now builds for both architectures:

### Build Commands:
- `npm run dist:win` - 64-bit Windows build
- `npm run dist:win:32` - 32-bit Windows build  
- `npm run dist:win:all` - Both 32-bit and 64-bit builds

### Architecture Detection:
The application automatically detects the system architecture and uses appropriate ODBC drivers.

## PyODBC Setup Instructions

### Prerequisites:
1. **Python 3.7 or higher** installed on the system
2. **Microsoft ODBC Driver** for your architecture (32-bit/64-bit)
3. **Tally ODBC Driver** properly configured

### Automated Setup:
Run the included setup script:
```bash
setup-python-deps.bat
```

### Manual Setup:
1. Install Python dependencies:
   ```bash
   pip install pyodbc>=4.0.0
   ```

2. For 32-bit systems with issues:
   ```bash
   pip install pyodbc --force-reinstall --no-deps
   ```

3. Alternative with conda:
   ```bash
   conda install pyodbc
   ```

### Troubleshooting PyODBC Installation:

**Issue: Build errors during pyodbc installation**
- Solution: Install Microsoft C++ Build Tools
- Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/

**Issue: 32-bit compatibility problems**
- Solution: Ensure you're using 32-bit Python with 32-bit ODBC drivers
- Verify: `python -c "import platform; print(platform.architecture())"`

**Issue: ODBC drivers not found**
- Solution: Install Microsoft ODBC Driver for SQL Server
- Download: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

## Testing the Setup

### 1. Check Python Availability:
```bash
python src/python/pyodbc_connector.py check
```

### 2. Test ODBC Drivers:
```bash
python src/python/pyodbc_connector.py drivers
```

### 3. Test Tally Connection:
```bash
python src/python/pyodbc_connector.py test "Driver={Tally ODBC Driver};Server=localhost;Port=9000;"
```

## Build Process

### Development Build:
```bash
npm install
cd frontend && npm install
cd ..
npm run build
npm run pack
```

### Production Builds:
```bash
# 64-bit Windows
npm run dist:win

# 32-bit Windows  
npm run dist:win:32

# Both architectures
npm run dist:win:all
```

## Final Configuration Steps

### 1. Verify Python Setup:
- Ensure Python 3.7+ is installed
- Run `setup-python-deps.bat` to install pyodbc
- Test with the provided Python script

### 2. Configure Tally ODBC:
- Install appropriate Tally ODBC Driver (32-bit or 64-bit)
- Configure Data Source Name (DSN) if needed
- Test connection from ODBC Data Sources Administrator

### 3. Build the Application:
- Choose appropriate architecture (32-bit or 64-bit)
- Run the corresponding build command
- Distribute the generated installer

### 4. Deploy and Test:
- Install on target system
- Verify all three connection methods work
- Test with actual Tally ERP 9 installation

## Architecture-Specific Notes

### 32-bit Systems:
- Use 32-bit Python installation
- Install 32-bit ODBC drivers
- Build with `npm run dist:win:32`
- Ensure Tally ODBC Driver is 32-bit version

### 64-bit Systems:
- Can use either 32-bit or 64-bit components
- 64-bit recommended for better performance
- Build with `npm run dist:win` or `npm run dist:win:all`
- Mixed architectures (32-bit Tally + 64-bit app) may require 32-bit ODBC components

## Error Handling

The application gracefully handles failures:
1. If node-odbc fails → Try pyodbc
2. If pyodbc fails → Try HTTP XML
3. If all fail → Display comprehensive error message

Error messages include:
- Method attempted
- Specific error details
- Suggested troubleshooting steps
- Installation instructions for missing components

## Support

For issues related to:
- **ODBC connectivity**: Check driver installations and DSN configuration
- **Python/pyodbc**: Verify Python installation and run setup script
- **32-bit compatibility**: Ensure all components match architecture
- **Build problems**: Check Node.js and npm versions, clear cache if needed