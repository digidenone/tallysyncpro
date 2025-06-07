/**
 * ================================================================
 * TallySyncPro - Main Application Entry Point
 * ================================================================
 * 
 * Enhanced main entry point that integrates all services and provides
 * comprehensive application lifecycle management with robust error
 * handling and performance monitoring.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Features:
 * - Service manager integration
 * - Enhanced IPC handlers
 * - Application lifecycle management
 * - Error handling and recovery
 * - Performance monitoring
 * 
 * ================================================================
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, protocol } = require('electron');
const path = require('path');
const { config } = require('./config/app.config');

// Import services
const serviceManager = require('./services/service-manager');
const databaseService = require('./services/database.service');
const tallyService = require('./services/tally.service');
const excelService = require('./services/excel.service');
const bugReportService = require('./services/bug-report.service');

// Import components
const splashScreen = require('./components/splash-screen');

// Global application state
let mainWindow;
let tray;
let isQuitting = false;

// Application statistics
const appStats = {
  startTime: Date.now(),
  totalSessions: 0,
  crashCount: 0,
  lastCrash: null
};

/**
 * ================================================================
 * APPLICATION INITIALIZATION WITH SPLASH SCREEN
 * ================================================================
 */

/**
 * Initialize application with splash screen and comprehensive service setup
 */
async function initializeApp() {
  try {
    // Show splash screen first
    splashScreen.create();
    splashScreen.updateProgress('Initializing TallySyncPro...', 10);
    
    // Set application user model ID (Windows)
    if (process.platform === 'win32') {
      app.setAppUserModelId(config.app.bundleId);
    }
    
    splashScreen.updateProgress('Setting up security...', 20);
    
    // Security: Disable web security in development only
    if (config.isDevelopment) {
      app.commandLine.appendSwitch('--disable-web-security');
      app.commandLine.appendSwitch('--disable-features', 'OutOfBlinkCors');
    }
    
    splashScreen.updateProgress('Loading services...', 40);
    
    // Initialize service manager
    console.log('Initializing services...');
    await serviceManager.initialize();
    
    splashScreen.updateProgress('Connecting to database...', 60);
    
    // Test database connection
    const dbStatus = await databaseService.testConnection();
    console.log('Database status:', dbStatus);
    
    splashScreen.updateProgress('Setting up user interface...', 80);
    
    // Setup service event listeners
    setupServiceEventListeners();
    
    splashScreen.updateProgress('Finalizing startup...', 95);
    
    console.log('Services initialized successfully');
    
    splashScreen.updateProgress('Ready!', 100);
    
    // Small delay to show complete progress
    setTimeout(() => {
      splashScreen.close();
    }, 500);
    setupServiceEventListeners();
    
    // Register custom protocol (for deep linking)
    registerCustomProtocol();
    
    console.log('Application initialized successfully');
    
  } catch (error) {
    console.error('Application initialization failed:', error);
    
    // Show error dialog and exit
    if (app.isReady()) {
      dialog.showErrorBox('Initialization Error', `Failed to initialize application: ${error.message}`);
    }
    
    app.exit(1);
  }
}

/**
 * ================================================================
 * WINDOW MANAGEMENT
 * ================================================================
 */

/**
 * Create splash screen
 */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: config.window.splash.width,
    height: config.window.splash.height,
    frame: config.window.splash.frame,
    alwaysOnTop: config.window.splash.alwaysOnTop,
    transparent: config.window.splash.transparent,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  // Load splash content
  splashWindow.loadFile(path.join(__dirname, 'assets', 'splash.html'));
  
  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });
  
  // Auto-close splash after main window is ready
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  }, 3000);
}

/**
 * Create main application window
 */
async function createMainWindow() {
  try {
    // Create splash window first
    if (config.ui.splash && config.ui.splash.enabled) {
      createSplashWindow();
    }
    
    mainWindow = new BrowserWindow({
      width: config.window.main.width,
      height: config.window.main.height,
      minWidth: config.window.main.minWidth,
      minHeight: config.window.main.minHeight,
      show: config.window.main.show,
      center: config.window.main.center,
      webPreferences: {
        preload: config.security.preloadScript,
        nodeIntegration: config.security.webPreferences.nodeIntegration,
        contextIsolation: config.security.webPreferences.contextIsolation,
        webSecurity: config.security.webPreferences.webSecurity,
        allowRunningInsecureContent: config.security.webPreferences.allowRunningInsecureContent
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      titleBarStyle: config.window.main.titleBarStyle,
      backgroundColor: '#ffffff'
    });
    
    // Load application content
    if (config.isDevelopment) {
      await mainWindow.loadURL(config.paths.frontend);
      
      // Open DevTools in development
      if (config.development.devTools.openOnStart) {
        mainWindow.webContents.openDevTools({
          mode: config.development.devTools.detached ? 'detach' : 'bottom'
        });
      }
    } else {
      await mainWindow.loadFile(config.paths.frontend);
    }
    
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
      if (config.window.main.maximized) {
        mainWindow.maximize();
      }
      mainWindow.show();
      
      // Close splash window
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      
      // Focus window
      mainWindow.focus();
    });
    
    // Setup window event handlers
    setupWindowEventHandlers();
    
    // Setup application menu
    setupApplicationMenu();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('Main window created successfully');
    
  } catch (error) {
    console.error('Failed to create main window:', error);
    throw error;
  }
}

/**
 * ================================================================
 * EVENT HANDLERS
 * ================================================================
 */

/**
 * Setup window event handlers
 */
function setupWindowEventHandlers() {
  // Window close handler
  mainWindow.on('close', async (event) => {
    if (isQuitting) {
      return;
    }
    
    event.preventDefault();
    
    // Show confirmation dialog
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Exit', 'Minimize to Tray', 'Cancel'],
      defaultId: 2,
      title: 'Confirm Exit',
      message: 'What would you like to do?',
      detail: 'You can exit the application or minimize it to the system tray.'
    });
    
    switch (response.response) {
      case 0: // Exit
        isQuitting = true;
        await cleanup();
        app.quit();
        break;
      case 1: // Minimize to tray
        mainWindow.hide();
        break;
      case 2: // Cancel
      default:
        break;
    }
  });
  
  // Window minimize handler
  mainWindow.on('minimize', (event) => {
    if (config.system.tray.minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  // Handle window restore
  mainWindow.on('restore', () => {
    mainWindow.show();
  });
  
  // Handle unresponsive window
  mainWindow.on('unresponsive', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Application Not Responding',
      message: 'The application appears to be unresponsive.',
      detail: 'Would you like to wait or restart the application?',
      buttons: ['Wait', 'Restart'],
      defaultId: 0
    }).then(result => {
      if (result.response === 1) {
        app.relaunch();
        app.exit(0);
      }
    });
  });
  
  // Handle responsive window
  mainWindow.on('responsive', () => {
    console.log('Application is now responsive');
  });
}

/**
 * Setup service event listeners
 */
function setupServiceEventListeners() {
  // Service Manager events
  serviceManager.on('initialized', () => {
    console.log('ServiceManager: All services initialized');
  });

  serviceManager.on('error', (error) => {
    console.error('ServiceManager: Error occurred:', error);
    bugReportService.reportCriticalError(error, 'ServiceManager');
  });

  serviceManager.on('filesCleanedUp', () => {
    console.log('ServiceManager: Files cleaned up successfully');
  });

  serviceManager.on('statisticsUpdated', (stats) => {
    // Update main window with new statistics if needed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('statistics-updated', stats);
    }
  });

  // Database Service events
  databaseService.on('connected', (connectionInfo) => {
    console.log('DatabaseService: Connected to database');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('database-connected', connectionInfo);
    }
  });

  databaseService.on('disconnected', () => {
    console.log('DatabaseService: Disconnected from database');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('database-disconnected');
    }
  });

  databaseService.on('error', (error) => {
    console.error('DatabaseService: Error occurred:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('database-error', error.message);
    }
  });

  // Tally Service events
  tallyService.on('connected', (tallyInfo) => {
    console.log('TallyService: Connected to Tally ERP');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tally-connected', tallyInfo);
    }
  });

  tallyService.on('syncStarted', (syncInfo) => {
    console.log('TallyService: Sync operation started');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync-started', syncInfo);
    }
  });

  tallyService.on('syncProgress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync-progress', progress);
    }
  });

  tallyService.on('syncCompleted', (result) => {
    console.log('TallyService: Sync operation completed');
    serviceManager.updateDashboardStatistics('sync', result);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('sync-completed', result);
    }
  });

  // Excel Service events
  excelService.on('fileProcessed', (fileInfo) => {
    console.log('ExcelService: File processed successfully');
    serviceManager.updateDashboardStatistics('file', fileInfo);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('file-processed', fileInfo);
    }
  });

  excelService.on('error', (error) => {
    console.error('ExcelService: Error occurred:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('excel-error', error.message);
    }
  });
}

/**
 * ================================================================
 * IPC HANDLERS
 * ================================================================
 */

/**
 * Setup IPC handlers for all services
 */
function setupIpcHandlers() {
  // Application info
  ipcMain.handle('app-get-info', () => ({
    name: config.app.name,
    version: config.app.version,
    author: config.app.author
  }));
  
  // Service management
  ipcMain.handle('service-get-status', () => {
    return serviceManager.getAllServiceStatuses();
  });
  
  ipcMain.handle('service-get-statistics', () => {
    return serviceManager.getOverallStatistics();
  });
  
  // Tally operations
  ipcMain.handle('tally-test-connection', async (event, profile) => {
    try {
      return await tallyService.connect(profile);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('tally-get-status', () => {
    return tallyService.getStatistics();
  });
  
  ipcMain.handle('tally-disconnect', async () => {
    try {
      return await tallyService.disconnect();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('tally-import-vouchers', async (event, data) => {
    try {
      return await tallyService.importVouchers(data);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('tally-export-vouchers', async (event, filters) => {
    try {
      return await tallyService.exportVouchers(filters);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('tally-get-masters', async (event, type) => {
    try {
      return await tallyService.getMasters(type);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Excel operations
  ipcMain.handle('excel-read', async (event, filePath, options) => {
    try {
      return await excelService.readExcelFile(filePath, options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('excel-write', async (event, filePath, data, options) => {
    try {
      return await excelService.writeExcelFile(filePath, data, options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('excel-get-templates', async () => {
    try {
      return await excelService.getAvailableTemplates();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // File operations
  ipcMain.handle('file-select', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', ...(options.multiSelections ? ['multiSelections'] : [])],
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      return {
        success: !result.canceled,
        files: result.filePaths || []
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('file-save', async (event, options) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: options.defaultName,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      return {
        success: !result.canceled,
        filePath: result.filePath
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // System operations
  ipcMain.handle('system-info', () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    memory: process.memoryUsage()
  }));
  
  ipcMain.handle('open-external', async (event, url) => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  
  // Development tools
  if (config.isDevelopment) {
    ipcMain.handle('open-dev-tools', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.openDevTools();
      }
    });
    
    ipcMain.handle('reload-app', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }
    });
  }
}

/**
 * ================================================================
 * APPLICATION LIFECYCLE
 * ================================================================
 */

/**
 * Application ready handler
 */
app.whenReady().then(async () => {
  try {
    // Initialize application
    await initializeApp();
    
    // Create main window
    await createMainWindow();
    
    // Setup IPC handlers
    setupIpcHandlers();
    
    // Create system tray
    if (config.system.tray.enabled) {
      createSystemTray();
    }
    
    // Update statistics
    appStats.totalSessions++;
    
    console.log('Application is ready');
    
  } catch (error) {
    console.error('Application startup failed:', error);
    app.exit(1);
  }
});

/**
 * Application window-all-closed handler
 */
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin' && !config.system.tray.enabled) {
    app.quit();
  }
});

/**
 * Application activate handler (macOS)
 */
app.on('activate', async () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

/**
 * Application before-quit handler
 */
app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    await cleanup();
    app.quit();
  }
});

/**
 * ================================================================
 * UTILITY FUNCTIONS
 * ================================================================
 */

/**
 * Create system tray
 */
function createSystemTray() {
  try {
    tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Application',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Hide Application',
        click: () => {
          if (mainWindow) {
            mainWindow.hide();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'About',        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About TallySyncPro',
            message: config.app.displayName,
            detail: `Version: ${config.app.version}\nAuthor: ${config.app.author}`
          });
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: async () => {
          isQuitting = true;
          await cleanup();
          app.quit();
        }
      }
    ]);
    
    tray.setToolTip(config.app.displayName);
    tray.setContextMenu(contextMenu);
    
    // Double-click to show/hide
    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to create system tray:', error);
  }
}

/**
 * Register custom protocol
 */
function registerCustomProtocol() {
  protocol.registerFileProtocol('tallysync', (request, callback) => {
    const url = request.url.substr(11); // Remove 'tallysync://'
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });
}

/**
 * Setup application menu
 */
function setupApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-project');
            }
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-open-project');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Import Excel',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-import-excel');
            }
          }
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-export-data');
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Test Tally Connection',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-test-connection');
            }
          }
        },
        {
          label: 'Service Status',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-service-status');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-preferences');
            }
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://docs.digidenone.com/tallysync');
          }
        },
        {
          label: 'Support',
          click: async () => {
            await shell.openExternal('mailto:support@digidenone.com');
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TallySyncPro',
              message: config.app.displayName,
              detail: `Version: ${config.app.version}\nAuthor: ${config.app.author}\nWebsite: ${config.app.website}`
            });
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  if (!config.ui.shortcuts.enabled) return;
  
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.type === 'keyDown') {
      const shortcuts = config.ui.shortcuts.navigation;
      
      switch (input.key) {
        case '1':
          mainWindow.webContents.send('navigate-to', 'dashboard');
          break;
        case '2':
          mainWindow.webContents.send('navigate-to', 'data-entry');
          break;
        case '3':
          mainWindow.webContents.send('navigate-to', 'tally-guide');
          break;
        case '4':
          mainWindow.webContents.send('navigate-to', 'settings');
          break;
        case '5':
          mainWindow.webContents.send('navigate-to', 'support');
          break;
      }
    }
  });
}

/**
 * Cleanup function
 */
async function cleanup() {
  try {
    console.log('Starting application cleanup...');
    
    // Shutdown services
    await serviceManager.shutdown();
    
    // Destroy tray
    if (tray && !tray.isDestroyed()) {
      tray.destroy();
    }
    
    console.log('Application cleanup completed');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  appStats.crashCount++;
  appStats.lastCrash = new Date();
  
  // Show error dialog
  if (app.isReady()) {
    dialog.showErrorBox('Unexpected Error', `An unexpected error occurred: ${error.message}`);
  }
  
  // Exit gracefully
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('TallySyncPro starting...');
