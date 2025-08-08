# 📦 TallySyncPro - Installation Guide

## 🎯 Quick Installation (Recommended)

### Download & Install
1. **Download**: 
   - `TallySyncPro.exe` for 64-bit Windows
2. **Run as Administrator**: Right-click installer → "Run as administrator"
3. **Follow Installation Wizard**: Accept license and choose install location
4. **Launch Application**: Use desktop shortcut (runs with admin privileges)

### Installation Process
The installer is created using InnoSetup from the packaged Electron application:
- Source: `dist-electron/win-unpacked/TallySyncPro.exe`  
- Output: `TallySyncPro.exe`

### First-Time Setup
1. **Tally Configuration**: Enable ODBC in Tally ERP 9
2. **Connection Test**: Use built-in connection tester
3. **Template Download**: Get Excel templates from Downloads section
4. **Quick Test**: Import sample data to verify setup

## 🔧 Advanced Installation Options

### Silent Installation
```cmd
# Silent installation
TallySyncPro.exe /SILENT /DIR="C:\TallySyncPro"
```

### Custom Installation Directory
```cmd
# Example with custom directory
TallySyncPro.exe /DIR="D:\Applications\TallySyncPro"
```

## 🏗️ Developer Installation

### Prerequisites
- Node.js 18+ LTS
- Git for version control
- Visual Studio Code (recommended)
- Tally ERP 9 with ODBC enabled

### Clone and Build
```bash
# Clone repository
git clone https://github.com/digidenone/tallysyncpro.git
cd tallysyncpro

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Development mode
npm run dev

# Build installer
cd build
verify-build-setup.bat
build-installer.bat
```

### Build Scripts Location
All build scripts are now in the **build/** directory:
- **build/verify-build-setup.bat** - Check prerequisites
- **build/build-installer.bat** - Create installer
- **build/start-tallysyncpro.bat** - Quick start script
- **build/installer.nsh** - NSIS installer configuration

## 💻 System Requirements

### Minimum Requirements
- Windows 10/11 (64-bit)
- 4 GB RAM
- 500 MB disk space
- Tally ERP 9 with ODBC enabled

### Recommended
- Windows 11 (64-bit)
- 8 GB RAM
- 1 GB disk space
- High-speed SSD storage

## ⚙️ Tally ERP 9 Configuration

### Enable ODBC Connectivity
1. Open Tally ERP 9
2. Go to **Gateway → F11 → Data Configuration**
3. Set **ODBC Connectivity** to **Yes**
4. Configure **HTTP Server Port** (default: 9000)
5. Save and restart Tally

### Test Connection
1. Launch TallySyncPro
2. Go to **Settings** → **Tally Configuration**
3. Enter connection details
4. Click **Test Connection**
5. Verify successful connection

## 🔍 Verification Steps

### Post-Installation Checklist
1. ✅ Application launches without errors
2. ✅ Dashboard displays system information
3. ✅ Tally connection test passes
4. ✅ Excel templates download successfully
5. ✅ Sample data import works correctly

### Troubleshooting Common Issues
- **Antivirus Warnings**: Add TallySyncPro to exclusions
- **ODBC Errors**: Ensure Tally ODBC driver is installed
- **Permission Issues**: Run as Administrator
- **Port Conflicts**: Check Tally ERP 9 port configuration

## 🔄 Updates

### Automatic Updates
- TallySyncPro checks for updates automatically
- Notifications appear when updates are available
- One-click update installation

### Manual Updates
1. Download latest version from releases
2. Run new installer (will upgrade existing installation)
3. Restart application
4. Verify new features are available

## 🗑️ Uninstallation

### Standard Uninstall
1. Go to **Windows Settings** → **Apps & Features**
2. Find **TallySyncPro** in the list
3. Click **Uninstall**
4. Follow uninstallation wizard

### Complete Removal
Additional cleanup locations:
- `%APPDATA%\TallySyncPro\` - User configuration
- `%LOCALAPPDATA%\TallySyncPro\` - Cache and logs
- Desktop shortcuts and start menu entries

## 📞 Support

For installation issues:
- **Email**: digidenone@gmail.com
- **Documentation**: Complete guides available
- **Community**: GitHub issues and discussions
- **Response Time**: 24-48 hours for community support

### Before Contacting Support
1. Check system requirements
2. Verify Tally ERP 9 configuration
3. Review error messages
4. Include system information in support request

# Installation and Configuration

This app prioritizes 32-bit ODBC connectivity to Tally ERP (ODBC DSN), then falls back to HTTP-XML Gateway, and finally to a 32-bit Python pyodbc helper.

## Prerequisites
- Tally ERP 9/Prime running with ODBC/Gateway enabled on port 9000.
- 32-bit Tally ODBC Driver installed.
- System DSN named `TallyODBC_9000` (32-bit), as shown in ODBC Administrator.
- Optional: 32-bit Python (e.g., Python 3.11 x86) if you want the pyodbc fallback.

## Environment Variables
- TALLY_DSN: override DSN name (default: `TallyODBC_9000`).
- TALLY_PYTHON32_PATH: path to 32-bit python.exe for pyodbc fallback.

## Build Targets
- Dev run: `npm start`
- Windows x64 build: `npm run dist:win`
- Windows 32-bit build: `npm run dist:win:ia32`
- All Windows builds (x64 + ia32): `npm run dist:win:all`

Note: To use the 32-bit System DSN directly via node-odbc, prefer the ia32 build.

## Connection Order
1. ODBC via DSN (32-bit) `TallyODBC_9000`
2. HTTP XML to Gateway (port 9000)
3. Python pyodbc using 32-bit Python against the DSN

## Testing
Use the app Settings/Dashboard “Test Tally Connection” button. You can also pass a DSN explicitly in code via `dsn: 'TallyODBC_9000'`.
