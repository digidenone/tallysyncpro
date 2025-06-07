/**
 * ================================================================
 * TallySyncPro - Frontend API Service
 * ================================================================
 * 
 * Bridges backend services with frontend components through
 * electron IPC and provides a unified API interface for
 * all TallySyncPro functionality.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const moment = require('moment');

class FrontendAPIService {
  constructor(serviceManager) {
    this.serviceManager = serviceManager;
    this.handlersRegistered = false; // Track handler registration
    this.isInitialized = false;
    
    // API endpoints registry
    this.endpoints = new Map();
    
    // Real-time event subscriptions
    this.subscriptions = new Map();
  }

  /**
   * Initialize the API service and register all IPC handlers
   */  async initialize() {
    if (this.isInitialized || this.handlersRegistered) {
      console.log('FrontendAPIService: Already initialized, skipping...');
      return;
    }

    try {
      // Register all API endpoints
      this.registerDashboardAPI();
      this.registerDataProcessingAPI();
      this.registerTallySyncAPI();
      this.registerLoggingAPI();
      this.registerFileManagementAPI();
      this.registerSystemAPI();
      this.registerConfigurationAPI();
        // Setup real-time event forwarding
      this.setupRealTimeEvents();
      
      this.isInitialized = true;
      this.handlersRegistered = true; // Mark handlers as registered
      console.log('FrontendAPIService: Initialized successfully');
      
      // Log initialization
      const logger = this.serviceManager.getLogger();
      if (logger) {
        await logger.logInfo('FrontendAPIService', 'API service initialized with all endpoints');
      }
      
    } catch (error) {
      console.error('FrontendAPIService: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register dashboard-related API endpoints
   */
  registerDashboardAPI() {
    // Check if handlers are already registered to prevent duplicates
    if (this.handlersRegistered) {
      return;
    }

    // Get dashboard statistics
    ipcMain.handle('api:dashboard:getStats', async () => {
      try {
        const dashboardService = this.serviceManager.getService('dashboard');
        if (!dashboardService) {
          throw new Error('Dashboard service not available');
        }

        const stats = await dashboardService.getStatistics();
        const systemHealth = await this.getSystemHealth();
        
        return {
          success: true,
          data: {
            ...stats,
            systemHealth,
            lastUpdated: new Date().toISOString()
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get chart data
    ipcMain.handle('api:dashboard:getChartData', async (event, options = {}) => {
      try {
        const dashboardService = this.serviceManager.getService('dashboard');
        const chartData = await dashboardService.getChartData(options);
        
        return {
          success: true,
          data: chartData
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get recent activities
    ipcMain.handle('api:dashboard:getRecentActivities', async (event, limit = 20) => {
      try {
        const dashboardService = this.serviceManager.getService('dashboard');
        const activities = await dashboardService.getRecentActivities(limit);
        
        return {
          success: true,
          data: activities
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    this.handlersRegistered = true;
  }

  /**
   * Register data processing API endpoints
   */
  registerDataProcessingAPI() {
    // Upload and process Excel file
    ipcMain.handle('api:data:uploadFile', async (event, filePath) => {
      try {
        const excelService = this.serviceManager.getService('excel');
        const result = await excelService.processFile(filePath);
        
        // Log the operation
        await this.serviceManager.logActivity('DataProcessing', 'File Upload', 'completed', {
          filePath,
          recordCount: result.data?.length || 0
        });
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        await this.serviceManager.logActivity('DataProcessing', 'File Upload', 'failed', {
          filePath,
          error: error.message
        });
        
        return { success: false, error: error.message };
      }
    });

    // Get processed data preview
    ipcMain.handle('api:data:getPreview', async (event, fileId, options = {}) => {
      try {
        const excelService = this.serviceManager.getService('excel');
        const preview = await excelService.getDataPreview(fileId, options);
        
        return {
          success: true,
          data: preview
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Validate data before sync
    ipcMain.handle('api:data:validate', async (event, fileId, validationRules = {}) => {
      try {
        const excelService = this.serviceManager.getService('excel');
        const validation = await excelService.validateData(fileId, validationRules);
        
        return {
          success: true,
          data: validation
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get data summary
    ipcMain.handle('api:data:getSummary', async (event, fileId) => {
      try {
        const excelService = this.serviceManager.getService('excel');
        const summary = await excelService.getDataSummary(fileId);
        
        return {
          success: true,
          data: summary
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register Tally sync API endpoints
   */
  registerTallySyncAPI() {
    // Test Tally connection
    ipcMain.handle('api:tally:testConnection', async (event, config) => {
      try {
        const tallyService = this.serviceManager.getService('tally');
        const result = await tallyService.testConnection(config);
        
        await this.serviceManager.logActivity('TallySync', 'Connection Test', 
          result.success ? 'completed' : 'failed', config);
        
        return result;
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Start sync operation
    ipcMain.handle('api:tally:startSync', async (event, syncConfig) => {
      try {
        const tallyService = this.serviceManager.getService('tally');
        const result = await tallyService.startBatchSync(syncConfig);
        
        await this.serviceManager.logActivity('TallySync', 'Sync Operation', 'started', {
          syncType: syncConfig.syncType,
          batchSize: syncConfig.batchSize
        });
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        await this.serviceManager.logActivity('TallySync', 'Sync Operation', 'failed', {
          error: error.message
        });
        
        return { success: false, error: error.message };
      }
    });

    // Get sync status
    ipcMain.handle('api:tally:getSyncStatus', async (event, syncId) => {
      try {
        const tallyService = this.serviceManager.getService('tally');
        const status = await tallyService.getSyncStatus(syncId);
        
        return {
          success: true,
          data: status
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Cancel sync operation
    ipcMain.handle('api:tally:cancelSync', async (event, syncId) => {
      try {
        const tallyService = this.serviceManager.getService('tally');
        const result = await tallyService.cancelSync(syncId);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get sync history
    ipcMain.handle('api:tally:getSyncHistory', async (event, options = {}) => {
      try {
        const tallyService = this.serviceManager.getService('tally');
        const history = await tallyService.getSyncHistory(options);
        
        return {
          success: true,
          data: history
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register logging API endpoints
   */
  registerLoggingAPI() {
    // Get recent logs
    ipcMain.handle('api:logs:getRecent', async (event, options = {}) => {
      try {
        const logger = this.serviceManager.getLogger();
        if (!logger) {
          throw new Error('Logging service not available');
        }

        const logs = logger.getRecentLogs(options.limit, options.level);
        
        return {
          success: true,
          data: logs
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Search logs
    ipcMain.handle('api:logs:search', async (event, query, options = {}) => {
      try {
        const logger = this.serviceManager.getLogger();
        const results = logger.searchLogs(query, options);
        
        return {
          success: true,
          data: results
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get logging statistics
    ipcMain.handle('api:logs:getStats', async () => {
      try {
        const logger = this.serviceManager.getLogger();
        const stats = logger.getLoggingStatistics();
        
        return {
          success: true,
          data: stats
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Export logs
    ipcMain.handle('api:logs:export', async (event, options = {}) => {
      try {
        const logger = this.serviceManager.getLogger();
        const result = await logger.exportLogs(options);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Set log level
    ipcMain.handle('api:logs:setLevel', async (event, level) => {
      try {
        const logger = this.serviceManager.getLogger();
        logger.setLogLevel(level);
        
        return {
          success: true,
          message: `Log level set to ${level}`
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Clear session logs
    ipcMain.handle('api:logs:clearSession', async () => {
      try {
        const logger = this.serviceManager.getLogger();
        logger.clearSessionLogs();
        
        return {
          success: true,
          message: 'Session logs cleared'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register file management API endpoints
   */
  registerFileManagementAPI() {
    // Select file dialog
    ipcMain.handle('api:files:selectFile', async (event, options = {}) => {
      try {
        const result = await dialog.showOpenDialog({
          title: options.title || 'Select File',
          filters: options.filters || [
            { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });
        
        if (result.canceled) {
          return { success: false, canceled: true };
        }
        
        return {
          success: true,
          data: {
            filePath: result.filePaths[0],
            fileName: path.basename(result.filePaths[0])
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get file info
    ipcMain.handle('api:files:getInfo', async (event, filePath) => {
      try {
        const stats = await fs.stat(filePath);
        const info = {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          extension: path.extname(filePath)
        };
        
        return {
          success: true,
          data: info
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Open file location
    ipcMain.handle('api:files:openLocation', async (event, filePath) => {
      try {
        shell.showItemInFolder(filePath);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get download templates
    ipcMain.handle('api:files:getTemplates', async () => {
      try {
        const templatesPath = path.join(__dirname, '../../frontend/public/downloads');
        const files = await fs.readdir(templatesPath);
        
        const templates = await Promise.all(
          files
            .filter(file => file.endsWith('.xlsx') || file.endsWith('.zip'))
            .map(async file => {
              const filePath = path.join(templatesPath, file);
              const stats = await fs.stat(filePath);
              return {
                name: file,
                path: filePath,
                size: stats.size,
                type: path.extname(file)
              };
            })
        );
        
        return {
          success: true,
          data: templates
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register system API endpoints
   */
  registerSystemAPI() {
    // Get system information
    ipcMain.handle('api:system:getInfo', async () => {
      try {
        const info = await this.getSystemInfo();
        return {
          success: true,
          data: info
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Get system health
    ipcMain.handle('api:system:getHealth', async () => {
      try {
        const health = await this.getSystemHealth();
        return {
          success: true,
          data: health
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Generate bug report
    ipcMain.handle('api:system:generateBugReport', async (event, description) => {
      try {
        const bugReportService = this.serviceManager.getService('bugReport');
        const report = await bugReportService.generateReport(description);
        
        return {
          success: true,
          data: report
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Cleanup temporary files
    ipcMain.handle('api:system:cleanup', async () => {
      try {
        const result = await this.serviceManager.performCleanup();
        return {
          success: true,
          data: result
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register configuration API endpoints
   */
  registerConfigurationAPI() {
    // Get application configuration
    ipcMain.handle('api:config:get', async (event, key) => {
      try {
        const config = this.serviceManager.getConfiguration(key);
        return {
          success: true,
          data: config
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Set application configuration
    ipcMain.handle('api:config:set', async (event, key, value) => {
      try {
        await this.serviceManager.setConfiguration(key, value);
        
        await this.serviceManager.logActivity('Configuration', 'Setting Updated', 'completed', {
          key,
          value: typeof value === 'object' ? '[Object]' : value
        });
        
        return {
          success: true,
          message: 'Configuration updated successfully'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Reset configuration
    ipcMain.handle('api:config:reset', async (event, key) => {
      try {
        await this.serviceManager.resetConfiguration(key);
        return {
          success: true,
          message: 'Configuration reset successfully'
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Legacy config handlers for compatibility
    ipcMain.handle('config-get', async (event, key) => {
      try {
        const config = this.serviceManager.getConfiguration(key);
        return {
          success: true,
          data: config
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('config-set', async (event, key, value) => {
      try {
        await this.serviceManager.setConfiguration(key, value);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Setup real-time event forwarding from services to frontend
   */
  setupRealTimeEvents() {
    // Dashboard events
    const dashboardService = this.serviceManager.getService('dashboard');
    if (dashboardService) {
      dashboardService.on('statsUpdated', (stats) => {
        this.broadcastToFrontend('dashboard:statsUpdated', stats);
      });
    }

    // Tally sync events
    const tallyService = this.serviceManager.getService('tally');
    if (tallyService) {
      tallyService.on('syncProgress', (progress) => {
        this.broadcastToFrontend('tally:syncProgress', progress);
      });
      
      tallyService.on('syncCompleted', (result) => {
        this.broadcastToFrontend('tally:syncCompleted', result);
      });
      
      tallyService.on('syncError', (error) => {
        this.broadcastToFrontend('tally:syncError', error);
      });
    }

    // Logging events
    const logger = this.serviceManager.getLogger();
    if (logger) {
      logger.on('logEntry', (logEntry) => {
        this.broadcastToFrontend('logs:newEntry', logEntry);
      });
    }

    // Service manager events
    this.serviceManager.on('serviceStatusChanged', (status) => {
      this.broadcastToFrontend('system:serviceStatusChanged', status);
    });
  }

  /**
   * Broadcast event to all frontend windows
   */
  broadcastToFrontend(event, data) {
    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(event, data);
      }
    });
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    const os = require('os');
    const { app } = require('electron');
    
    return {
      app: {
        name: app.getName(),
        version: app.getVersion(),
        path: app.getAppPath()
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: {
        model: os.cpus()[0]?.model || 'Unknown',
        cores: os.cpus().length,
        loadAvg: os.loadavg()
      }
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const os = require('os');
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      checks: {
        memory: {
          status: 'ok',
          usage: memoryUsage,
          available: os.freemem()
        },
        services: {
          status: 'ok',
          running: Object.keys(this.serviceManager.services).length,
          failed: 0
        },
        disk: {
          status: 'ok',
          // Add disk space check if needed
        }
      },
      timestamp: new Date().toISOString()
    };

    // Check memory usage
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 90) {
      health.checks.memory.status = 'warning';
      health.status = 'warning';
    }

    return health;
  }

  /**
   * Cleanup API service
   */
  cleanup() {
    ipcMain.removeAllListeners();
    this.subscriptions.clear();
    this.endpoints.clear();
  }
}

module.exports = FrontendAPIService;
