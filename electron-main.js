/**
 * ================================================================
 * TallySyncPro - Electron Main Process
 * ================================================================
 * 
 * This file serves as the main entry point for the Electron application.
 * It handles window creation, menu setup, IPC communication, and application lifecycle.
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Key Responsibilities:
 * - Create and manage the main application window
 * - Set up application menus with keyboard shortcuts
 * - Handle application events (ready, window-all-closed, etc.)
 * - Manage ODBC connections for Tally integration
 * - Implement security measures (context isolation, preload scripts)
 * 
 * Security Features:
 * - Context isolation enabled
 * - Node integration disabled in renderer
 * - Preload script for secure IPC communication
 * 
 * ================================================================
 */

// Import required Electron modules and Node.js dependencies
const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');

// Try to import ODBC with fallback
let odbc = null;
try {
    odbc = require('odbc'); // For Tally ERP database connectivity
} catch (error) {
    console.warn('ODBC module not available. Database functionality will be limited.');
}

// Import services and components
const serviceManager = require('./src/services/service-manager');
const FrontendAPIService = require('./src/services/frontend-api.service');
const bugReportService = require('./src/services/bug-report.service');
const splashScreen = require('./src/components/splash-screen');

// Initialize services
let frontendAPI = null;

// Set application name for better OS integration
app.name = 'TallySyncPro';

// Global variables for application state management
let mainWindow;    // Main application window instance
let tray;          // System tray instance (if needed)
let appInitialized = false; // Flag to prevent duplicate initialization
let securityConfigured = false; // Flag to prevent duplicate security configuration
let isShuttingDown = false; // Flag to prevent duplicate shutdown

/**
 * Creates the main application window with security and performance optimizations
 * 
 * @function createWindow
 * @description Sets up the main BrowserWindow with proper security settings,
 *              loads the appropriate content (dev server or built files),
 *              and configures the application menu system.
 */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    title: 'TallySyncPro',
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    // icon: path.join(__dirname, 'icon.ico'),
    skipTaskbar: false
  });
  // Detect dev mode
  const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER === 'true';
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }
    mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // Open maximized
    mainWindow.show();
  });

  // Register global keyboard shortcuts for navigation
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.type === 'keyDown') {
      switch (input.key) {
        case '1':
          mainWindow.webContents.executeJavaScript(`window.location.hash = '/';`);
          break;
        case '2':
          mainWindow.webContents.executeJavaScript(`window.location.hash = '/data-entry';`);
          break;
        case '3':
          mainWindow.webContents.executeJavaScript(`window.location.hash = '/tally-guide';`);
          break;
        case '4':
          mainWindow.webContents.executeJavaScript(`window.location.hash = '/settings';`);
          break;
        case '5':
          mainWindow.webContents.executeJavaScript(`window.location.hash = '/support';`);
          break;
        case '6':
          mainWindow.webContents.executeJavaScript(`window.location.hash = '/about';`);
          break;
      }
    }
  });// Set custom menu
  const template = [
    {
      label: 'View',
      submenu: [
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { 
          label: 'Go Back',
          accelerator: 'Alt+Left',
          click: () => {
            if (mainWindow.webContents.canGoBack()) {
              mainWindow.webContents.goBack();
            }
          }
        },
        { 
          label: 'Go Forward',
          accelerator: 'Alt+Right',
          click: () => {
            if (mainWindow.webContents.canGoForward()) {
              mainWindow.webContents.goForward();
            }
          }
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Show Keyboard Shortcuts',
          accelerator: 'F1',          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'TallySyncPro Keyboard Shortcuts',
              detail: `
Navigation:
• Ctrl+1 - Dashboard
• Ctrl+2 - Data Entry
• Ctrl+3 - Tally Guide
• Ctrl+4 - Settings
• Ctrl+5 - Support
• Ctrl+6 - About

View:
• Ctrl+0 - Reset Zoom
• Ctrl++ - Zoom In
• Ctrl+- - Zoom Out
• F11 - Toggle Fullscreen

Window:
• Alt+Left - Go Back
• Alt+Right - Go Forward
• F5 - Reload
• Shift+F5 - Force Reload
• F12 - Developer Tools

Other:
• Alt+F4 - Exit
• F1 - Show this help
              `
            });
          }
        },        { type: 'separator' },
        {
          label: 'Bug Reporting',
          submenu: [
            {
              label: 'Send Bug Report via Email',
              click: async () => {
                try {
                  const subject = 'TallySyncPro Bug Report';
                  const body = `Bug Report for TallySyncPro

Version: ${app.getVersion()}
OS: ${process.platform} ${process.arch}
Date: ${new Date().toISOString()}

Please describe the issue:



Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:


Additional information:


Log files location: ${path.join(app.getPath('userData'), 'logs')}

Sent from TallySyncPro`;

                  const mailtoUrl = `mailto:digidenone@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  await shell.openExternal(mailtoUrl);
                } catch (error) {
                  console.error('Failed to open email:', error);
                  dialog.showErrorBox('Email Error', 'Failed to open email client. Please manually email digidenone@gmail.com');
                }
              }
            },
            {
              label: 'Send Bug Report via WhatsApp',
              click: async () => {
                try {
                  const message = `*TallySyncPro Bug Report*

Version: ${app.getVersion()}
OS: ${process.platform} ${process.arch}
Date: ${new Date().toISOString()}

Issue Description:


Steps to reproduce:
1. 
2. 
3. 

Expected: 
Actual: 

Log location: ${path.join(app.getPath('userData'), 'logs')}`;

                  const whatsappUrl = `https://wa.me/917439611385?text=${encodeURIComponent(message)}`;
                  await shell.openExternal(whatsappUrl);
                } catch (error) {
                  console.error('Failed to open WhatsApp:', error);
                  dialog.showErrorBox('WhatsApp Error', 'Failed to open WhatsApp. Please manually message +91 7439611385');
                }
              }
            }
          ]
        },
        {
          label: 'Feedback',
          submenu: [
            {
              label: 'Send Feedback via Email',
              click: async () => {
                const subject = 'TallySyncPro Feedback';
                const body = `Your feedback helps us improve TallySyncPro:

Feedback Type: [General/Feature Request/Improvement/Other]

Your Experience:
- What do you like about TallySyncPro?
- What could be improved?
- How would you rate your overall experience? (1-10)

Suggestions:


Additional Comments:


---
User Details:
- Version: ${app.getVersion()}
- OS: ${process.platform} ${process.arch}
- Date: ${new Date().toISOString()}

Thank you for your feedback!
Sent from TallySyncPro`;

                try {
                  const mailtoUrl = `mailto:digidenone@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  await shell.openExternal(mailtoUrl);
                } catch (error) {
                  // Fallback to web email
                  const webMailUrl = `https://mail.google.com/mail/?view=cm&to=digidenone@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  shell.openExternal(webMailUrl);
                }
              }
            },
            {
              label: 'Send Feedback via WhatsApp',
              click: async () => {
                const message = `💬 TallySyncPro Feedback

Hi! I'd like to share feedback about TallySyncPro:

Version: ${app.getVersion()}
Overall Experience: [Rate 1-10]

What I like:
[Please share what you enjoy about the app]

Suggestions for improvement:
[Any features or improvements you'd like to see]

Additional comments:
[Any other thoughts or feedback]

Thank you for creating this helpful tool! 😊`;

                try {
                  const whatsappWebUrl = `https://wa.me/917439611385?text=${encodeURIComponent(message)}`;
                  
                  try {
                    await shell.openExternal(whatsappUrl);
                  } catch (appError) {
                    await shell.openExternal(whatsappWebUrl);
                  }
                } catch (error) {
                  console.error('Failed to open WhatsApp:', error);
                  dialog.showErrorBox('Error', 'Failed to open WhatsApp. Please try again or contact support via email.');
                }
              }
            }
          ]
        },
        {
          label: 'Support',
          submenu: [            {
              label: 'Get Support via Email',
              click: async () => {
                const subject = 'TallySyncPro Support Request';
                const body = `Support Request for TallySyncPro:

Issue Category: [Installation/Configuration/Usage/Technical/Other]

Description of Issue:
[Please describe what you need help with]

What you were trying to do:
[Step-by-step description]

Current Status:
[What's happening now]

What you've already tried:
[Any troubleshooting steps you've attempted]

---
System Information:
- Version: ${app.getVersion()}
- OS: ${process.platform} ${process.arch}
- Date: ${new Date().toISOString()}

We'll get back to you as soon as possible!
Sent from TallySyncPro`;

                try {
                  const mailtoUrl = `mailto:digidenone@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  await shell.openExternal(mailtoUrl);
                } catch (error) {
                  const webMailUrl = `https://mail.google.com/mail/?view=cm&to=digidenone@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  shell.openExternal(webMailUrl);
                }
              }
            },
            {
              label: 'Get Support via WhatsApp',
              click: async () => {
                const message = `🆘 TallySyncPro Support Request

Hi! I need help with TallySyncPro:

System Information:
- Version: ${app.getVersion()}
- OS: ${process.platform} ${process.arch}

Issue Type: [Installation/Setup/Usage/Technical/Other]

Problem Description:
[Please describe what you need help with]

What I was trying to do:
[Step-by-step description]

Current situation:
[What's happening now]

What I've tried:
[Any troubleshooting steps]

Additional details:
[Screenshots or error messages can be shared separately]

Thank you for your support! 🙏`;

                try {
                  const whatsappWebUrl = `https://wa.me/917439611385?text=${encodeURIComponent(message)}`;
                  
                  try {
                    await shell.openExternal(whatsappUrl);
                  } catch (appError) {
                    await shell.openExternal(whatsappWebUrl);
                  }
                } catch (error) {
                  console.error('Failed to open WhatsApp:', error);
                  dialog.showErrorBox('Error', 'Failed to open WhatsApp. Please try again or contact support via email.');
                }
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'File Locations',
          submenu: [
            {
              label: 'Open Application Data',
              click: async () => {
                try {
                  const dbPath = path.join(app.getPath('userData'), 'data');
                  await shell.openPath(dbPath);
                } catch (error) {
                  dialog.showErrorBox('Error', 'Failed to open application data directory');
                }
              }
            },
            {
              label: 'Open Logs Directory',
              click: async () => {
                try {
                  const logsPath = path.join(app.getPath('userData'), 'logs');
                  await shell.openPath(logsPath);
                } catch (error) {
                  dialog.showErrorBox('Error', 'Failed to open logs directory');
                }
              }
            },
            {
              label: 'Show All Data Locations',
              click: () => {
                const userDataPath = app.getPath('userData');
                const paths = {
                  'User Data': userDataPath,
                  'Application Data': path.join(userDataPath, 'data'),
                  'Log Files': path.join(userDataPath, 'logs'),
                  'Configuration': path.join(userDataPath, 'config'),
                  'Temporary Files': path.join(userDataPath, 'temp')
                };
                
                const pathsText = Object.entries(paths)
                  .map(([name, path]) => `${name}:\n${path}`)
                  .join('\n\n');

                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'TallySyncPro File Locations',
                  message: 'Data Storage Locations',
                  detail: pathsText,
                  buttons: ['OK', 'Open User Data Folder'],
                  defaultId: 0
                }).then((result) => {
                  if (result.response === 1) {
                    shell.openPath(userDataPath);
                  }
                });
              }
            }
          ]
        },        {
          label: 'About TallySyncPro',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TallySyncPro',
              message: `TallySyncPro v${app.getVersion()}`,
              detail: `Desktop Application for Excel to Tally ERP Integration

Created by: Digidenone
Contact: digidenone@gmail.com
Phone/WhatsApp: +91 7439611385

Copyright © 2025 Digidenone. All rights reserved.
This software is licensed for authorized use only.

Built with Electron ${process.versions.electron}
Node.js ${process.version}
Platform: ${process.platform} ${process.arch}`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  mainWindow.on('close', async (event) => {
    if (app.isQuiting) {
      return;
    }
    
    event.preventDefault();
    
    const response = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Exit', 'Cancel'],
      defaultId: 1,
      title: 'Confirm Exit',
      message: 'Are you sure you want to exit TallySyncPro?',
      detail: 'The application will close completely.'
    });

    if (response.response === 0) {
      app.isQuiting = true;
      mainWindow.destroy();
    }
  });
}

/**
 * Enhanced System Tray Setup with Advanced Features
 */
function setupSystemTray() {
  try {
    // Create a simple icon for the system tray
    const nativeImage = require('electron').nativeImage;
    const trayIcon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    tray = new Tray(trayIcon);
    
    // Enhanced context menu with more options
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'TallySyncPro',
        enabled: false,
        icon: undefined // Could add small icon here
      },
      { type: 'separator' },
      {
        label: 'Show Dashboard',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.executeJavaScript(`
            window.location.hash = '/dashboard';
          `);
        }
      },
      {
        label: 'Data Entry',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.executeJavaScript(`
            window.location.hash = '/data-entry';
          `);
        }
      },
      {
        label: 'Settings',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.executeJavaScript(`
            window.location.hash = '/settings';
          `);
        }
      },
      { type: 'separator' },
      {
        label: 'Service Status',
        submenu: [
          {
            label: 'View Service Status',
            click: async () => {
              try {
                const status = serviceManager.getServiceStatuses();
                const statusText = Object.entries(status)
                  .map(([service, data]) => `${service}: ${data.status}`)
                  .join('\n');
                
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'TallySyncPro Service Status',
                  message: 'Current Service Status',
                  detail: statusText
                });
              } catch (error) {
                dialog.showErrorBox('Error', 'Failed to get service status');
              }
            }
          },
          {
            label: 'Restart Services',
            click: async () => {
              try {
                await serviceManager.restart();
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'Services Restarted',
                  message: 'All services have been restarted successfully'
                });
              } catch (error) {
                dialog.showErrorBox('Error', 'Failed to restart services');
              }
            }
          }
        ]
      },
      {
        label: 'Quick Actions',
        submenu: [
          {
            label: 'Test Tally Connection',
            click: () => {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.executeJavaScript(`
                // Trigger connection test
                window.dispatchEvent(new CustomEvent('test-tally-connection'));
              `);
            }
          },
          {
            label: 'View Recent Activity',
            click: () => {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.executeJavaScript(`
                window.location.hash = '/dashboard';
                // Scroll to activity section
                setTimeout(() => {
                  const activitySection = document.querySelector('[data-section="recent-activity"]');
                  if (activitySection) activitySection.scrollIntoView();
                }, 500);
              `);
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Support & Help',
        submenu: [
          {
            label: 'Contact Support',
            click: () => {
              shell.openExternal('mailto:support@digidenone.com?subject=TallySyncPro Support Request');
            }
          },
          {
            label: 'WhatsApp Support',
            click: () => {
              shell.openExternal('https://wa.me/+919876543210?text=Hello! I need support with TallySyncPro.');
            }
          },
          {
            label: 'About TallySyncPro',
            click: () => {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.executeJavaScript(`
                window.location.hash = '/about';
              `);
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Hide to Tray',
        click: () => {
          mainWindow.hide();
        }
      },
      {
        label: 'Quit TallySyncPro',
        click: () => {
          app.isQuiting = true;
          app.quit();
        }
      }
    ]);
    
    // Set tooltip and context menu
    tray.setToolTip('TallySyncPro - Excel to Tally Integration');
    tray.setContextMenu(contextMenu);
    
    // Handle tray click events
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    tray.on('double-click', () => {
      mainWindow.show();
      mainWindow.focus();
    });
    
    // Update tray tooltip with status
    setInterval(() => {
      try {
        const status = serviceManager.getServiceStatuses();
        const allRunning = Object.values(status).every(s => s.status === 'running');
        const tooltip = allRunning 
          ? 'TallySyncPro - All Services Running'
          : 'TallySyncPro - Some Services Issues';
        tray.setToolTip(tooltip);
      } catch (error) {
        // Ignore tooltip update errors
      }
    }, 30000); // Update every 30 seconds
    
  } catch (error) {
    console.error('Failed to setup system tray:', error);
  }
}

/**
 * Configure Windows Security Settings
 */
async function configureWindowsSecurity() {
  if (securityConfigured) {
    return;
  }
  
  try {
    // Set app user model ID for Windows
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.digidenone.tallysyncpro');
    }
    
    // Request single instance lock
    const gotTheLock = app.requestSingleInstanceLock();
    
    if (!gotTheLock) {
      app.quit();
      return;
    }
    
    // Handle second instance
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, focus our window instead
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    
    // Configure security settings
    app.on('web-contents-created', (event, contents) => {
      // Disable navigation to external websites
      contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:8080' && 
            parsedUrl.origin !== 'file://') {
          event.preventDefault();
        }
      });
      
      // Prevent new window creation
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    });
    
    // Configure certificate verification bypass for development
    if (process.env.NODE_ENV === 'development') {
      app.commandLine.appendSwitch('ignore-certificate-errors');
      app.commandLine.appendSwitch('ignore-ssl-errors');
      app.commandLine.appendSwitch('allow-insecure-localhost');    }
    
    console.log('Windows security configuration completed');
    securityConfigured = true;
    
  } catch (error) {
    console.error('Failed to configure Windows security:', error);
  }
}

app.whenReady().then(async () => {
  try {
    // Configure Windows security settings first
    await configureWindowsSecurity();
    
    // Initialize the application
    await initializeApp();

  } catch (error) {
    console.error('Failed to initialize TallySyncPro:', error);
    
    // Close splash screen on error
    if (splashScreen.isDisplayed()) {
      splashScreen.close();
    }
    
    // Show error dialog
    dialog.showErrorBox('Initialization Error', 
      `Failed to start TallySyncPro: ${error.message}`);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle before-quit event for graceful shutdown
app.on('before-quit', (event) => {
  if (!isShuttingDown) {
    event.preventDefault();
    isShuttingDown = true;
    
    console.log('TallySyncPro: Starting shutdown sequence...');
    
    // Start async cleanup but don't wait for it
    performShutdown().then(() => {
      console.log('TallySyncPro: Shutdown complete, exiting...');
      process.exit(0);
    }).catch((error) => {
      console.error('TallySyncPro: Shutdown error:', error);
      process.exit(1);
    });
    
    // Force exit after 5 seconds
    setTimeout(() => {
      console.log('TallySyncPro: Force exit due to timeout');
      process.exit(1);
    }, 5000);
  }
});

// Separate async function for shutdown
async function performShutdown() {
  try {
    console.log('TallySyncPro: Stopping services...');
    
    // Stop services
    if (serviceManager && typeof serviceManager.shutdown === 'function') {
      await Promise.race([
        serviceManager.shutdown(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Service shutdown timeout')), 2000))
      ]);
    }
    
    console.log('TallySyncPro: Services stopped');
    
    // Quick cleanup - don't wait too long
    await Promise.race([
      cleanupOnExit(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 2000))
    ]);
    
    console.log('TallySyncPro: Cleanup completed');
    
  } catch (error) {
    console.error('TallySyncPro: Shutdown error:', error);
    throw error;
  }
}

// Force quit mechanism to ensure app exits properly
app.on('will-quit', (event) => {
  console.log('TallySyncPro: Application will quit');
  // Don't prevent the quit, let it happen
});

// Add explicit process exit handlers
process.on('SIGTERM', () => {
  console.log('TallySyncPro: SIGTERM received, forcing exit');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('TallySyncPro: SIGINT received, forcing exit');
  process.exit(0);
});

// Handle activate event (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Add timeout to force quit if cleanup takes too long
let shutdownTimeout = null;

function forceQuit() {
  console.log('TallySyncPro: Force quitting application');
  process.exit(0);
}

// ================================================================
// IPC HANDLERS FOR COMPREHENSIVE FUNCTIONALITY
// ================================================================

// Service Manager IPC Handlers
ipcMain.handle('get-service-status', async () => {
  try {
    return {
      success: true,
      services: serviceManager.getServiceStatuses(),
      statistics: serviceManager.getDashboardData()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cleanup-files', async () => {
  try {
    await serviceManager.cleanupUploadedFiles();
    return { success: true, message: 'Files cleaned up successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bug Reporting IPC Handlers
ipcMain.handle('submit-bug-report', async (event, bugData) => {
  try {
    if (bugData.action === 'email') {
      const result = await bugReportService.openEmailClient(bugData);
      return { success: result.success, method: 'email', message: result.message };
    } else if (bugData.action === 'save') {
      const result = await bugReportService.saveBugReportToFile(bugData);
      return { success: result.success, method: 'file', ...result };
    }
    return { success: false, error: 'Invalid action' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Enhanced IPC handlers for bug reporting and system information
ipcMain.handle('get-system-info', async () => {
  try {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      osRelease: require('os').release(),
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
      cpus: require('os').cpus().length,
      uptime: process.uptime(),
      errorCount: errorCount
    };
  } catch (error) {
    console.error('Failed to get system info:', error);
    return null;
  }
});

ipcMain.handle('submit-bug-report-with-attachments', async (event, bugReport) => {
  try {
    const reportId = require('crypto').randomUUID();
    const timestamp = new Date().toISOString();
    
    // Save bug report locally
    const reportData = {
      id: reportId,
      timestamp,
      ...bugReport,
      systemInfo: await ipcMain.handle('get-system-info')
    };
    
    // Use bug report service if available
    const result = await bugReportService.submitBugReportWithAttachments(reportData);
    
    // Reset error count after successful bug report
    errorCount = 0;
    
    return { success: true, reportId, result };
  } catch (error) {
    console.error('Failed to submit bug report:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-log-file-paths', async () => {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    const fs = require('fs').promises;
    
    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        path: path.join(logsDir, file),
        size: 0 // Could add file size if needed
      }));
    
    return logFiles;
  } catch (error) {
    console.error('Failed to get log files:', error);
    return [];
  }
});

/**
 * Get log file paths for attachments
 */
async function getLogFilePaths() {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    const fs = require('fs').promises;
    
    if (!(await fs.access(logsDir).then(() => true).catch(() => false))) {
      return [];
    }
    
    const files = await fs.readdir(logsDir);
    const logFiles = [];
    
    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);
        logFiles.push({
          name: file,
          path: filePath,
          size: stats.size
        });
      }
    }
    
    return logFiles.sort((a, b) => b.name.localeCompare(a.name)); // Most recent first
  } catch (error) {
    console.error('Failed to get log files:', error);
    return [];
  }
}

// Dashboard Data IPC Handlers
ipcMain.handle('get-dashboard-data', async () => {
  try {
    const dashboardData = serviceManager.getDashboardData();
    return { success: true, data: dashboardData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-dashboard-statistics', async (event, operation, data) => {
  try {
    serviceManager.updateDashboardStatistics(operation, data);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// File Operations IPC Handlers
ipcMain.handle('upload-file', async (event, fileData) => {
  try {
    const fileId = await serviceManager.trackUploadedFile(fileData.path);
    return { success: true, fileId };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('process-excel-file', async (event, filePath) => {
  try {
    const result = await excelService.processFile(filePath);
    serviceManager.addRecentActivity({
      type: 'file_processed',
      message: `Processed Excel file: ${path.basename(filePath)}`,
      details: result
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Tally Integration IPC Handlers
ipcMain.handle('test-tally-connection', async (event, connectionData) => {
  try {
    const result = await tallyService.testConnection(connectionData);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sync-to-tally', async (event, syncData) => {
  try {
    const result = await tallyService.syncData(syncData);
    serviceManager.addRecentActivity({
      type: 'sync_completed',
      message: `Synchronized data to Tally ERP`,
      details: result
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Application Lifecycle IPC Handlers
ipcMain.handle('app-ready', async () => {
  try {
    // Mark app as ready and update statistics
    serviceManager.updateDashboardStatistics('initialization', { success: true });
    serviceManager.addRecentActivity({
      type: 'app_started',
      message: 'TallySyncPro application started successfully'
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('app-shutdown', async () => {
  try {
    await serviceManager.shutdown();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Settings IPC Handlers
ipcMain.handle('get-app-settings', async () => {
  try {
    const settings = serviceManager.appStore.store;
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-app-settings', async (event, newSettings) => {
  try {
    Object.keys(newSettings).forEach(key => {
      serviceManager.appStore.set(key, newSettings[key]);
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ================================================================
// EXISTING ODBC HANDLER (Enhanced)
// ================================================================
ipcMain.handle('odbc-query', async (event, { connectionString, query }) => {
  try {
    if (!odbc) {
      return { success: false, error: 'ODBC module not available' };
    }
    const connection = await odbc.connect(connectionString);
    const result = await connection.query(query);
    await connection.close();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Tally IPC Handlers
ipcMain.handle('tally-test-connection', async (event, config) => {
  try {
    if (!odbc) {
      return { success: false, error: 'ODBC module not available' };
    }
    // Test Tally connection using ODBC
    const connection = await odbc.connect(config.connectionString);
    const result = await connection.query('SELECT * FROM TallyStatus');
    await connection.close();
    return { success: true, connected: true };
  } catch (err) {
    return { success: false, error: err.message, connected: false };
  }
});

ipcMain.handle('tally-get-status', async () => {
  try {
    if (!odbc) {
      return { success: false, error: 'ODBC module not available', connected: false };
    }
    // Get saved connection string from config
    const config = {}; // TODO: Implement config storage
    const connection = await odbc.connect(config.connectionString);
    const result = await connection.query('SELECT * FROM TallyStatus');
    await connection.close();
    return { success: true, connected: true };
  } catch (err) {
    return { success: false, connected: false };
  }
});

ipcMain.handle('tally-import-vouchers', async (event, data) => {
  try {
    if (!odbc) {
      return { success: false, error: 'ODBC module not available' };
    }
    const connection = await odbc.connect(data.connectionString);
    // Execute the import query based on data
    const result = await connection.query(data.query);
    await connection.close();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('tally-export-vouchers', async (event, filters) => {
  try {
    if (!odbc) {
      return { success: false, error: 'ODBC module not available' };
    }
    const connection = await odbc.connect(filters.connectionString);
    // Execute the export query based on filters
    const result = await connection.query(filters.query);
    await connection.close();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('tally-get-masters', async (event, type) => {
  try {
    if (!odbc) {
      return { success: false, error: 'ODBC module not available' };
    }
    const connection = await odbc.connect(type.connectionString);
    // Get masters based on type (ledgers, items, etc.)
    const result = await connection.query(type.query);
    await connection.close();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Config management
let tallyConfig = {};

ipcMain.handle('tally-save-config', async (event, config) => {
  try {
    tallyConfig = { ...config };
    // TODO: Implement persistent storage
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('tally-get-config', async () => {
  return { success: true, config: tallyConfig };
});

// ================================================================
// INITIALIZATION SEQUENCE
// ================================================================

/**
 * Application initialization sequence with enhanced error handling and logging
 */
async function initializeApp() {
  // Prevent duplicate initialization
  if (appInitialized) {
    return; // Silent return, no need to log this
  }
  
  try {
    appInitialized = true;
      // Show splash screen first with initial progress
    splashScreen.create();
    await new Promise(resolve => setTimeout(resolve, 700)); // Allow splash to render
    splashScreen.updateProgress('Starting TallySyncPro...', 8);
    
    // Security configuration
    await new Promise(resolve => setTimeout(resolve, 450));
    splashScreen.updateProgress('Configuring security...', 18);
    
    // Database initialization
    await new Promise(resolve => setTimeout(resolve, 500));
    splashScreen.updateProgress('Initializing database...', 28);
    
    // Service manager initialization
    await new Promise(resolve => setTimeout(resolve, 450));
    splashScreen.updateProgress('Starting service manager...', 38);
    
    // Initialize individual services with detailed progress
    await new Promise(resolve => setTimeout(resolve, 400));
    splashScreen.updateProgress('Loading database service...', 48);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    splashScreen.updateProgress('Loading Tally integration...', 58);
    await serviceManager.initialize();
    
    // Excel service
    await new Promise(resolve => setTimeout(resolve, 450));
    splashScreen.updateProgress('Setting up Excel processing...', 68);
    
    // Initialize frontend API service
    await new Promise(resolve => setTimeout(resolve, 400));
    splashScreen.updateProgress('Building API bridge...', 78);
    if (!frontendAPI) {
      frontendAPI = new FrontendAPIService(serviceManager);
      await frontendAPI.initialize();
    }
    
    // Create main window
    await new Promise(resolve => setTimeout(resolve, 500));
    splashScreen.updateProgress('Building user interface...', 88);
    createWindow();
    
    // Setup system integration
    await new Promise(resolve => setTimeout(resolve, 400));
    splashScreen.updateProgress('Configuring system tray...', 95);
    setupSystemTray();
    
    // Final preparations
    await new Promise(resolve => setTimeout(resolve, 400));
    splashScreen.updateProgress('Finalizing startup...', 98);
      // Complete initialization
    await new Promise(resolve => setTimeout(resolve, 350));
    splashScreen.updateProgress('TallySyncPro is Ready!', 100);
    
    // Close splash screen after showing "Ready" for a moment
    setTimeout(() => {
      splashScreen.close();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, 800); // Show "Ready!" state for a bit

    console.log('TallySyncPro initialized successfully');

  } catch (error) {
    console.error('Failed to initialize TallySyncPro:', error);
    
    // Close splash screen on error
    if (splashScreen.isDisplayed()) {
      splashScreen.close();
    }
    
    // Show error dialog
    dialog.showErrorBox('Initialization Error', 
      `Failed to start TallySyncPro: ${error.message}`);
  }
}

// Start the application
app.whenReady().then(() => {
  // Initialize the app (security will be configured within initializeApp)
  initializeApp();
});

// System Information IPC Handlers
ipcMain.handle('get-app-data-paths', async () => {
  try {
    const paths = {
      userData: app.getPath('userData'),
      logs: path.join(app.getPath('userData'), 'logs'),
      database: path.join(app.getPath('userData'), 'data'),
      bugReports: path.join(app.getPath('userData'), 'bug-reports'),
      temp: app.getPath('temp'),
      downloads: app.getPath('downloads'),
      documents: app.getPath('documents')
    };
    
    return { success: true, paths };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-data-directory', async (event, directoryType = 'userData') => {
  try {
    let dirPath;
    switch (directoryType) {
      case 'logs':
        dirPath = path.join(app.getPath('userData'), 'logs');
        break;
      case 'database':
        dirPath = path.join(app.getPath('userData'), 'data');
        break;
      case 'bugReports':
        dirPath = path.join(app.getPath('userData'), 'bug-reports');
        break;
      default:
        dirPath = app.getPath('userData');
    }
    
    await shell.openPath(dirPath);
    return { success: true, path: dirPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Clean up application on exit
 */
async function cleanupOnExit() {
  try {
    console.log('TallySyncPro: Starting cleanup...');
    
    // Clean up temporary files and logs
    const fsExtra = require('fs-extra');
    const userDataPath = app.getPath('userData');
    
    try {
      // Clean temporary files
      const tempPath = path.join(userDataPath, 'temp');
      if (await fsExtra.pathExists(tempPath)) {
        await fsExtra.emptyDir(tempPath);
        console.log('TallySyncPro: Temporary files cleaned');
      }
        // Clean old log files (keep only last 1 day)
      const logsPath = path.join(userDataPath, 'logs');
      if (await fsExtra.pathExists(logsPath)) {
        const files = await fsExtra.readdir(logsPath);
        const oneDayAgo = Date.now() - (1 * 24 * 60 * 60 * 1000); // 1 day instead of 3
        
        for (const file of files) {
          if (file.endsWith('.log')) {
            const filePath = path.join(logsPath, file);
            const stats = await fsExtra.stat(filePath);
            if (stats.mtime.getTime() < oneDayAgo) {
              await fsExtra.remove(filePath);
            }
          }
        }
        console.log('TallySyncPro: Old log files cleaned');
      }
      
      // Remove uploaded files that are no longer needed
      const uploadsPath = path.join(userDataPath, 'uploads');
      if (await fsExtra.pathExists(uploadsPath)) {
        await fsExtra.emptyDir(uploadsPath);
        console.log('TallySyncPro: Upload cache cleaned');
      }
      
    } catch (cleanupError) {
      console.warn('TallySyncPro: Cleanup warning:', cleanupError.message);
    }
    
    console.log('TallySyncPro: Cleanup completed successfully');
    
  } catch (error) {
    console.error('TallySyncPro: Cleanup failed:', error);
  }
}

// ================================================================
// GLOBAL ERROR HANDLING
// ================================================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = `Unhandled Promise Rejection: ${reason}`;
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  
  // Log the error if logging service is available
  try {
    const logger = serviceManager.getLogger();
    if (logger) {
      logger.logError('UnhandledRejection', errorMessage);
    }
  } catch (logError) {
    console.error('Failed to log unhandled rejection:', logError);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // Log the error if logging service is available
  try {
    const logger = serviceManager.getLogger();
    if (logger) {
      logger.logError('UncaughtException', error.message);
    }
  } catch (logError) {
    console.error('Failed to log uncaught exception:', logError);
  }
  
  // Attempt graceful shutdown
  try {
    app.quit();
  } catch (quitError) {
    process.exit(1);
  }
});