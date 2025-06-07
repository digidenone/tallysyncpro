/**
 * ================================================================
 * TallySyncPro - Application Configuration
 * ================================================================
 * 
 * Centralized configuration management for the desktop application.
 * This file contains all configuration settings, defaults, and
 * environment-specific configurations.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Configuration Categories:
 * - Application settings
 * - Tally connection settings
 * - UI/UX preferences
 * - Security settings
 * - Development vs Production settings
 * 
 * ================================================================
 */

const path = require('path');
const os = require('os');

/**
 * Environment detection
 */
const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Application Configuration Object
 */
const appConfig = {
  
  // ================================================================
  // APPLICATION METADATA
  // ================================================================
  app: {
    name: 'TallySyncPro',
    displayName: 'TallySyncPro - Desktop Edition',
    version: '1.0',
    description: 'Desktop Application for Excel to Tally ERP Integration',
    author: 'Digidenone Team',
    website: 'https://digidenone.is-a.dev',
    supportEmail: 'digidenone@gmail.com',
    
    // Application identifiers
    bundleId: 'com.digidenone.tallysyncpro',
    appId: 'tallysyncpro',
    
    // Auto-updater configuration
    autoUpdater: {
      enabled: isProduction,
      checkForUpdatesOnStart: true,
      downloadUpdatesAutomatically: false,
      updateServer: 'https://updates.digidenone.is-a.dev/tallysync'
    }
  },

  // ================================================================
  // WINDOW CONFIGURATION
  // ================================================================
  window: {
    // Main window settings
    main: {
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      
      // Window behavior
      show: false, // Don't show until ready
      center: true,
      resizable: true,
      maximizable: true,
      minimizable: true,
      closable: true,
      
      // Window chrome
      frame: true,
      titleBarStyle: 'default',
      transparent: false,
      
      // Security settings
      webSecurity: true,
      allowRunningInsecureContent: false,
      
      // Performance
      backgroundThrottling: false,
      offscreen: false
    },
    
    // Splash screen (if needed)
    splash: {
      width: 400,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      show: false
    }
  },

  // ================================================================
  // SECURITY CONFIGURATION
  // ================================================================
  security: {
    // Preload script
    preloadScript: path.join(__dirname, '..', '..', 'electron-preload.js'),
    
    // Content Security Policy
    csp: {
      enabled: isProduction,
      policy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    },
    
    // Web preferences
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    }
  },

  // ================================================================
  // TALLY ERP CONFIGURATION
  // ================================================================
  tally: {
    // Default connection settings
    connection: {
      defaultHost: 'localhost',
      defaultPort: 9000,
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 2000, // 2 seconds
      
      // ODBC driver configuration
      odbc: {
        driver: 'Tally ODBC Driver',
        dsn: 'TallyDatabase',
        connectionPooling: true,
        maxConnections: 5
      }
    },
    
    // Data synchronization settings
    sync: {
      batchSize: 100,
      maxConcurrentOperations: 3,
      autoSyncInterval: 300000, // 5 minutes (0 to disable)
      conflictResolution: 'prompt', // 'prompt', 'overwrite', 'skip'
      
      // Backup settings
      backup: {
        enabled: true,
        location: path.join(os.homedir(), 'TallySyncPro', 'backups'),
        retentionDays: 30,
        autoBackupBeforeSync: true
      }
    },
    
    // Supported voucher types
    voucherTypes: [
      'Sales',
      'Purchase',
      'Receipt',
      'Payment',
      'Contra',
      'Journal',
      'Debit Note',
      'Credit Note',
      'Stock Journal',
      'Physical Stock',
      'Delivery Note',
      'Receipt Note'
    ],
    
    // Master data types
    masterTypes: [
      'Ledger',
      'Group',
      'Stock Item',
      'Stock Group',
      'Unit of Measure',
      'Currency',
      'Godown',
      'Cost Centre',
      'Cost Category'
    ]
  },

  // ================================================================
  // FILE SYSTEM CONFIGURATION
  // ================================================================
  paths: {
    // Application data directory
    appData: path.join(os.homedir(), 'TallySyncPro'),
    
    // Configuration files
    config: path.join(os.homedir(), 'TallySyncPro', 'config'),
    
    // Log files
    logs: path.join(os.homedir(), 'TallySyncPro', 'logs'),
    
    // Templates
    templates: path.join(__dirname, '..', '..', '..', 'templates'),
    
    // Temporary files
    temp: path.join(os.tmpdir(), 'tallysync-pro'),
    
    // Export/Import directories
    exports: path.join(os.homedir(), 'TallySyncPro', 'exports'),
    imports: path.join(os.homedir(), 'TallySyncPro', 'imports'),
    
    // Frontend build directory
    frontend: isDevelopment 
      ? 'http://localhost:5173' 
      : path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html')
  },

  // ================================================================
  // LOGGING CONFIGURATION
  // ================================================================
  logging: {
    level: isDevelopment ? 'debug' : 'info',
    maxFileSize: '10MB',
    maxFiles: 5,
    format: 'combined', // 'simple', 'json', 'combined'
    
    // Log categories
    categories: {
      app: true,
      tally: true,
      sync: true,
      security: true,
      performance: true,
      error: true
    },
    
    // Console logging (development)
    console: {
      enabled: isDevelopment,
      colorize: true,
      timestamp: true
    }
  },

  // ================================================================
  // UI/UX CONFIGURATION
  // ================================================================
  ui: {
    // Theme settings
    theme: {
      default: 'light',
      allowUserChange: true,
      systemThemeDetection: true
    },
    
    // Animation settings
    animations: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    },
    
    // Notification settings
    notifications: {
      enabled: true,
      position: 'top-right',
      timeout: 5000,
      sound: false
    },
    
    // Keyboard shortcuts
    shortcuts: {
      enabled: true,
      customizable: false, // Future feature
      
      // Default shortcuts
      navigation: {
        dashboard: 'CmdOrCtrl+1',
        dataEntry: 'CmdOrCtrl+2',
        tallyGuide: 'CmdOrCtrl+3',
        settings: 'CmdOrCtrl+4',
        support: 'CmdOrCtrl+5',
        about: 'CmdOrCtrl+6'
      },
      
      actions: {
        save: 'CmdOrCtrl+S',
        refresh: 'F5',
        help: 'F1',
        devTools: 'F12',
        fullscreen: 'F11'
      }
    }
  },

  // ================================================================
  // DEVELOPMENT CONFIGURATION
  // ================================================================
  development: {
    enabled: isDevelopment,
    
    // DevTools
    devTools: {
      openOnStart: false,
      detached: false
    },
    
    // Hot reload
    hotReload: {
      enabled: true,
      watchPaths: ['src/**/*', 'frontend/src/**/*']
    },
    
    // Debug settings
    debug: {
      verbose: true,
      showPerformanceMetrics: true,
      logIpcCommunication: true
    }
  },

  // ================================================================
  // SYSTEM INTEGRATION
  // ================================================================
  system: {
    // System tray
    tray: {
      enabled: true,
      minimizeToTray: true,
      closeToTray: false,
      startMinimized: false
    },
    
    // Auto-start
    autoStart: {
      enabled: false,
      hidden: false
    },
    
    // File associations
    fileAssociations: [
      {
        ext: '.tallysync',
        name: 'TallySync Project File',
        description: 'TallySync Pro project configuration file'
      }
    ],
    
    // Protocol handlers
    protocols: [
      {
        scheme: 'tallysync',
        name: 'TallySync Protocol',
        description: 'Handle TallySync deep links'
      }
    ]
  }
};

/**
 * Environment-specific configuration overrides
 */
const environmentConfig = {
  development: {
    window: {
      main: {
        webPreferences: {
          devTools: true
        }
      }
    },
    tally: {
      connection: {
        timeout: 10000 // Shorter timeout for development
      }
    }
  },
  
  production: {
    security: {
      webPreferences: {
        devTools: false
      }
    },
    logging: {
      level: 'warn'
    }
  }
};

/**
 * Merge configurations based on environment
 */
function mergeConfig(base, override) {
  const result = { ...base };
  
  for (const key in override) {
    if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = mergeConfig(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  
  return result;
}

// Apply environment-specific overrides
const finalConfig = mergeConfig(
  appConfig, 
  environmentConfig[process.env.NODE_ENV] || {}
);

/**
 * Configuration validation
 */
function validateConfig(config) {
  const errors = [];
  
  // Validate required paths
  if (!config.paths.appData) {
    errors.push('Application data path is required');
  }
  
  // Validate Tally settings
  if (!config.tally.connection.defaultHost) {
    errors.push('Default Tally host is required');
  }
  
  if (config.tally.connection.defaultPort < 1 || config.tally.connection.defaultPort > 65535) {
    errors.push('Invalid Tally port number');
  }
  
  // Validate window settings
  if (config.window.main.width < 800 || config.window.main.height < 600) {
    errors.push('Minimum window size is 800x600');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// Validate configuration on load
validateConfig(finalConfig);

/**
 * Export configuration object and utility functions
 */
module.exports = {
  config: finalConfig,
  isDevelopment,
  isProduction,
  validateConfig,
  
  // Utility functions
  getConfigValue: (path, defaultValue = null) => {
    const keys = path.split('.');
    let value = finalConfig;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  },
  
  // Get platform-specific configuration
  getPlatformConfig: () => {
    const platform = process.platform;
    return finalConfig.platform?.[platform] || {};
  }
};
