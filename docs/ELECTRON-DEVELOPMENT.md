# 🔧 Electron Development Guide

This guide covers development practices specific to the TallySyncPro application.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Environment Setup](#development-environment-setup)
- [Main Process Development](#main-process-development)
- [Renderer Process Development](#renderer-process-development)
- [IPC Communication](#ipc-communication)
- [ODBC Integration](#odbc-integration)
- [Security Considerations](#security-considerations)
- [Debugging and Testing](#debugging-and-testing)
- [Build and Distribution](#build-and-distribution)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TallySyncPro Desktop                    │
├─────────────────────────────────────────────────────────────┤
│  Main Process (Node.js)                                    │
│  ├── Window Management                                      │
│  ├── ODBC Connections                                       │
│  ├── File System Operations                                 │
│  ├── Menu & Shortcuts                                       │
│  └── IPC Handlers                                          │
├─────────────────────────────────────────────────────────────┤
│  Preload Script (Secure Bridge)                            │
│  ├── Context Bridge APIs                                    │
│  └── Secure IPC Channels                                   │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (React + TypeScript)                     │
│  ├── User Interface Components                              │
│  ├── State Management                                       │
│  ├── Business Logic                                         │
│  └── Tally API Integration                                  │
└─────────────────────────────────────────────────────────────┘
```

## 💻 Development Environment Setup

### Prerequisites
```bash
# Node.js and npm versions
node --version  # v18.0.0 or higher
npm --version   # v8.0.0 or higher
```

### Environment Configuration
Create `.env` file in the frontend directory:
```env
# Development mode
NODE_ENV=development
VITE_DEV_SERVER=true

# API Configuration
VITE_API_URL=http://localhost:3001
VITE_ELECTRON_MODE=true

# Tally Configuration
VITE_TALLY_HOST=localhost
VITE_TALLY_PORT=9000
VITE_TALLY_TIMEOUT=30000

# Logging
VITE_LOG_LEVEL=debug
ELECTRON_LOG_LEVEL=debug
```

### Development Workflow
```bash
# 1. Install dependencies
npm install
cd frontend && npm install && cd ..

# 2. Start development server
npm run dev

# 3. In separate terminal, start Electron
npm start
```

## 🔧 Main Process Development

### Window Management
```javascript
// electron-main.js
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,          // Security
      contextIsolation: true,          // Security
      enableRemoteModule: false,       // Security
      webSecurity: true               // Security
    }
  });
  
  // Load content based on environment
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }
}
```

### ODBC Connection Management
```javascript
const odbc = require('odbc');

class TallyConnection {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }
  
  async connect(config) {
    try {
      const connectionString = `DSN=${config.dsn};UID=${config.username};PWD=${config.password};`;
      this.connection = await odbc.connect(connectionString);
      this.isConnected = true;
      return { success: true };
    } catch (error) {
      console.error('Connection failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async query(sql) {
    if (!this.isConnected) {
      throw new Error('Not connected to Tally');
    }
    return await this.connection.query(sql);
  }
  
  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.isConnected = false;
    }
  }
}
```

### IPC Handler Registration
```javascript
// Register IPC handlers
ipcMain.handle('tally-connect', async (event, config) => {
  return await tallyConnection.connect(config);
});

ipcMain.handle('tally-query', async (event, sql) => {
  return await tallyConnection.query(sql);
});

ipcMain.handle('tally-disconnect', async () => {
  return await tallyConnection.disconnect();
});
```

## 🎨 Renderer Process Development

### TypeScript Configuration
```typescript
// types/electron.d.ts
interface Window {
  tallyAPI: {
    testConnection: (config: ConnectionConfig) => Promise<ConnectionResult>;
    importVouchers: (data: VoucherData) => Promise<ImportResult>;
    exportVouchers: (filters: ExportFilters) => Promise<ExportResult>;
    getMasters: (type: MasterType) => Promise<MasterResult>;
    // ... other API methods
  };
  appInfo: {
    version: string;
    name: string;
    platform: string;
  };
}

interface ConnectionConfig {
  host: string;
  port: number;
  company: string;
  username?: string;
  password?: string;
}
```

### React Components
```typescript
// components/TallyConnection.tsx
import React, { useState, useEffect } from 'react';

export const TallyConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [config, setConfig] = useState<ConnectionConfig>({
    host: 'localhost',
    port: 9000,
    company: ''
  });
  
  const handleConnect = async () => {
    setConnectionStatus('connecting');
    try {
      const result = await window.tallyAPI.testConnection(config);
      if (result.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
        console.error('Connection failed:', result.error);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Connection error:', error);
    }
  };
  
  return (
    <div className="connection-panel">
      {/* Connection UI */}
    </div>
  );
};
```

## 🔗 IPC Communication

### Secure API Exposure
```javascript
// electron-preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tallyAPI', {
  // Connection methods
  testConnection: (config) => ipcRenderer.invoke('tally-test-connection', config),
  getConnectionStatus: () => ipcRenderer.invoke('tally-get-status'),
  
  // Data operations
  importVouchers: (data) => ipcRenderer.invoke('tally-import-vouchers', data),
  exportVouchers: (filters) => ipcRenderer.invoke('tally-export-vouchers', filters),
  
  // Event listeners
  onConnectionStatusChange: (callback) => {
    ipcRenderer.on('connection-status-changed', (event, status) => callback(status));
  },
  
  // Cleanup
  removeListener: (eventName) => {
    ipcRenderer.removeAllListeners(eventName);
  }
});
```

### Error Handling
```javascript
// Main process error handling
ipcMain.handle('tally-operation', async (event, operation, data) => {
  try {
    const result = await performTallyOperation(operation, data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Tally operation failed:', error);
    return { 
      success: false, 
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.stack
      }
    };
  }
});
```

## 🔌 ODBC Integration

### Connection String Configuration
```javascript
const buildConnectionString = (config) => {
  const params = [
    `Driver={Tally ODBC Driver}`,
    `Server=${config.host}`,
    `Port=${config.port}`,
    `Database=${config.company}`,
    `Trusted_Connection=yes`
  ];
  
  if (config.username) {
    params.push(`UID=${config.username}`);
  }
  
  if (config.password) {
    params.push(`PWD=${config.password}`);
  }
  
  return params.join(';');
};
```

### Query Builder
```javascript
class TallyQueryBuilder {
  static getLedgers(filters = {}) {
    let query = 'SELECT NAME, PARENT, OPENINGBALANCE FROM LEDGER';
    const conditions = [];
    
    if (filters.group) {
      conditions.push(`PARENT = '${filters.group}'`);
    }
    
    if (filters.dateFrom) {
      conditions.push(`EFFECTIVEDATE >= '${filters.dateFrom}'`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    return query;
  }
  
  static getVouchers(filters = {}) {
    return `
      SELECT 
        V.VOUCHERNUMBER,
        V.DATE,
        V.VOUCHERTYPE,
        V.REFERENCE,
        V.NARRATION,
        VE.LEDGERNAME,
        VE.AMOUNT
      FROM VOUCHER V
      LEFT JOIN VOUCHERENTRY VE ON V.GUID = VE.VOUCHERGUID
      WHERE V.DATE BETWEEN '${filters.fromDate}' AND '${filters.toDate}'
    `;
  }
}
```

## 🔐 Security Considerations

### Content Security Policy
```html
<!-- frontend/index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' ws: wss:;
">
```

### Secure File Operations
```javascript
// Validate file paths
const path = require('path');
const fs = require('fs').promises;

const validateFilePath = (filePath, allowedDir) => {
  const resolvedPath = path.resolve(filePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new Error('Invalid file path');
  }
  
  return resolvedPath;
};

// Secure file reading
ipcMain.handle('read-excel-file', async (event, filePath) => {
  try {
    const safeFilePath = validateFilePath(filePath, app.getPath('documents'));
    const fileData = await fs.readFile(safeFilePath);
    return { success: true, data: fileData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## 🐛 Debugging and Testing

### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/desktop-electron-odbc",
      "program": "${workspaceFolder}/desktop-electron-odbc/electron-main.js",
      "args": ["--remote-debugging-port=9223"]
    },
    {
      "name": "Electron: Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9223,
      "webRoot": "${workspaceFolder}/desktop-electron-odbc/frontend/src"
    }
  ]
}
```

### Logging Setup
```javascript
// utils/logger.js
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.ensureLogDir();
  }
  
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      pid: process.pid,
      version: app.getVersion()
    };
    
    const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}] ${message}`, data || '');
    }
  }
  
  info(message, data) { this.log('INFO', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
  error(message, data) { this.log('ERROR', message, data); }
  debug(message, data) { this.log('DEBUG', message, data); }
}

module.exports = new Logger();
```

## 📦 Build and Distribution

### Build Scripts
```json
{
  "scripts": {
    "build:dev": "npm run build && electron-builder --win --x64 --config.compression=store",
    "build:prod": "npm run build && electron-builder --win --x64 --publish=never",
    "build:all": "npm run build && electron-builder --win --mac --linux",
    "dist:github": "npm run build && electron-builder --publish=always"
  }
}
```

### Distribution Configuration
```json
{
  "build": {
    "appId": "com.digidenone.tallysyncpro",
    "productName": "TallySyncPro",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron-main.js",
      "electron-preload.js",
      "frontend/dist/**/*",
      "node_modules/**/*",
      "package.json",
      "icon.ico"
    ],
    "win": {
      "target": "nsis",
      "icon": "icon.ico",
      "requestedExecutionLevel": "requireAdministrator"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "publish": {
      "owner": "digidenone",
      "repo": "tallysync-pro"
    }
  }
}
```

## 🎯 Best Practices

### Code Organization
```
desktop-electron-odbc/
├── main/                   # Main process code
│   ├── window-manager.js
│   ├── odbc-service.js
│   ├── ipc-handlers.js
│   └── menu-builder.js
├── preload/               # Preload scripts
│   ├── api-bridge.js
│   └── security.js
├── shared/                # Shared utilities
│   ├── constants.js
│   ├── validators.js
│   └── types.ts
└── tests/                 # Test files
    ├── main.test.js
    ├── preload.test.js
    └── integration/
```

### Performance Optimization
- Use `webContents.executeJavaScript()` sparingly
- Implement proper cleanup in `beforeunload`
- Use streaming for large data operations
- Implement connection pooling for ODBC
- Cache frequently accessed data

### Error Recovery
- Implement automatic reconnection logic
- Provide user-friendly error messages
- Log errors for debugging
- Graceful degradation for offline scenarios

---

**Next: [Frontend Development Guide](FRONTEND-DEVELOPMENT.md)**
