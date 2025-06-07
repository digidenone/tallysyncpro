/**
 * ================================================================
 * TallySyncPro - Service Manager
 * ================================================================
 * 
 * Central service manager that coordinates all application services,
 * manages service lifecycle, handles inter-service communication,
 * and provides a unified interface for the application.
 * 
 * @version 1.0
 * @author Digidenone
 * @since 2025
 * 
 * Features:
 * - Service lifecycle management
 * - Local data storage management
 * - File cleanup on application exit
 * - Persistent dashboard statistics
 * - Service dependency injection
 * - Event coordination between services
 * - Health monitoring
 * - Error handling and recovery
 * 
 * ================================================================
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const fsExtra = require('fs-extra');
const Store = require('electron-store');
const { JsonDB, Config } = require('node-json-db');
const chokidar = require('chokidar');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const log = require('electron-log');

// Import all services
const databaseService = require('./database.service');
const tallyService = require('./tally.service');
const excelService = require('./excel.service');
const BugReportService = require('./bug-report.service');
const loggingService = require('./logging.service');

/**
 * Service Manager Class
 * Manages all application services and their interactions
 */
class ServiceManager extends EventEmitter {  constructor() {
    super();
    
    // Singleton pattern - prevent multiple instances
    if (ServiceManager.instance) {
      return ServiceManager.instance;
    }
    ServiceManager.instance = this;
    
    // Service registry
    this.services = new Map();
    this.serviceStatus = new Map();
    this.isInitialized = false;
    
    // Service dependencies
    this.dependencies = new Map();
    
    // Local storage instances
    this.appStore = new Store({
      name: 'tallysyncpro-settings',
      defaults: {
        version: '1.0',
        firstRun: true,
        theme: 'light',
        language: 'en',
        autoUpdates: true,
        statistics: {
          totalSyncs: 0,
          totalFiles: 0,
          lastSync: null,
          errors: 0,
          successfulSyncs: 0
        },
        connections: [],
        recentFiles: []
      }
    });

    // Dashboard data storage (persistent)
    this.dashboardStore = new Store({
      name: 'tallysyncpro-dashboard',
      defaults: {
        statistics: {
          totalSyncs: 0,
          totalFiles: 0,
          totalRecords: 0,
          lastSyncDate: null,
          averageTime: 0,
          errorCount: 0,
          successRate: 100
        },
        recentActivity: [],
        syncHistory: [],
        performance: {
          avgProcessingTime: 0,
          peakMemoryUsage: 0,
          totalErrors: 0
        }
      }
    });    
    
    // Database for file tracking and temporary data
    this.fileTracker = new JsonDB(new Config(path.join(this.getDataPath(), 'file-tracker.json'), true, false, '/'));
    
    // Service configurations
    this.config = {
      cleanup: {
        enabled: true,
        onExit: true,
        uploadFolder: path.join(this.getDataPath(), 'uploads'),
        tempFolder: path.join(this.getDataPath(), 'temp'),
        retentionDays: 0 // Auto-delete on exit
      },
      monitoring: {
        enabled: true,
        interval: 30000,
        healthChecks: true
      },
      storage: {
        dataPath: this.getDataPath(),
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedExtensions: ['.xlsx', '.xls', '.csv']
      }
    };

    // File watcher for upload folder
    this.fileWatcher = null;
    
    // Application statistics
    this.statistics = {
      startTime: Date.now(),
      totalOperations: 0,
      errors: 0,
      successes: 0,
      avgResponseTime: 0
    };

    // Initialize data structures
    this.initializeDataStructures();
    
    // Initialization state
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Health monitoring
    this.healthChecks = new Map();
    this.healthCheckInterval = null;
    
    // Register services
    this.registerServices();
  }
  
  /**
   * Get application data path
   */
  getDataPath() {
    const { app } = require('electron');
    return path.join(app.getPath('userData'), 'data');
  }
  /**
   * Initialize data structures and create necessary directories
   */
  async initializeDataStructures() {
    try {
      // Ensure data directories exist
      await fsExtra.ensureDir(this.config.storage.dataPath);
      await fsExtra.ensureDir(this.config.cleanup.uploadFolder);
      await fsExtra.ensureDir(this.config.cleanup.tempFolder);      // Initialize file tracker database with all required paths
      try {
        // Try to get existing data
        let data;
        try {
          data = this.fileTracker.getData('/');
        } catch (error) {
          // Database doesn't exist, initialize it
          log.info('ServiceManager: Creating new file tracker database structure');
          this.fileTracker.push('/', {
            uploadedFiles: [],
            filesToDelete: [],
            lastCleanup: new Date().toISOString(),
            metadata: { version: '1.0' }
          });
          data = this.fileTracker.getData('/');
        }
        
        // Ensure uploadedFiles exists and is an array
        if (!data.uploadedFiles || !Array.isArray(data.uploadedFiles)) {
          log.info('ServiceManager: Initializing uploadedFiles array structure');
          this.fileTracker.push('/uploadedFiles', []);
        }
        
        // Ensure filesToDelete exists and is an array  
        if (!data.filesToDelete || !Array.isArray(data.filesToDelete)) {
          log.info('ServiceManager: Initializing filesToDelete array structure');
          this.fileTracker.push('/filesToDelete', []);
        }
        
      } catch (error) {
        log.error('ServiceManager: Failed to initialize file tracker database:', error);
        // Create minimal structure as fallback
        this.fileTracker.push('/uploadedFiles', []);
        this.fileTracker.push('/filesToDelete', []);
      }

      log.info('ServiceManager: Data structures initialized');
    } catch (error) {
      log.error('ServiceManager: Failed to initialize data structures:', error);
      throw error;
    }
  }  /**
   * Ensure uploadedFiles path exists in database and is always an array
   */
  ensureUploadedFilesPath() {
    try {
      const data = this.fileTracker.getData('/uploadedFiles');
      // If data exists but is not an array, fix it
      if (!Array.isArray(data)) {
        log.info('ServiceManager: Initializing uploadedFiles array structure');
        this.fileTracker.push('/uploadedFiles', []);
      }
    } catch (error) {
      // Path doesn't exist, create it
      log.info('ServiceManager: Creating uploadedFiles array');
      this.fileTracker.push('/uploadedFiles', []);
    }
    
    // Also ensure filesToDelete exists
    try {
      const deleteData = this.fileTracker.getData('/filesToDelete');
      if (!Array.isArray(deleteData)) {
        log.info('ServiceManager: Initializing filesToDelete array structure');
        this.fileTracker.push('/filesToDelete', []);
      }
    } catch (error) {
      log.info('ServiceManager: Creating filesToDelete array');
      this.fileTracker.push('/filesToDelete', []);
    }
  }

  // ================================================================
  // SERVICE REGISTRATION
  // ================================================================
    /**
   * Register all application services
   */
  registerServices() {
    // Register logging service first (no dependencies)
    this.services.set('logging', loggingService);
    this.serviceStatus.set('logging', 'registered');
    this.dependencies.set('logging', []);
    
    // Register database service
    this.services.set('database', databaseService);
    this.serviceStatus.set('database', 'registered');
    this.dependencies.set('database', ['logging']);
    
    // Register Tally service (depends on database and logging)
    this.services.set('tally', tallyService);
    this.serviceStatus.set('tally', 'registered');
    this.dependencies.set('tally', ['database', 'logging']);
    
    // Register Excel service
    this.services.set('excel', excelService);
    this.serviceStatus.set('excel', 'registered');
    this.dependencies.set('excel', ['logging']);
    
    // Register Bug Report service
    this.services.set('bugReport', BugReportService);
    this.serviceStatus.set('bugReport', 'registered');
    this.dependencies.set('bugReport', ['logging']);
    
    console.log(`Registered ${this.services.size} services`);
  }
  
  /**
   * Register a custom service
   */
  registerService(name, service, dependencies = []) {
    if (this.services.has(name)) {
      throw new Error(`Service '${name}' is already registered`);
    }
    
    this.services.set(name, service);
    this.serviceStatus.set(name, 'registered');
    this.dependencies.set(name, dependencies);
    
    console.log(`Registered service: ${name}`);
  }
  
  // ================================================================
  // SERVICE LIFECYCLE MANAGEMENT
  // ================================================================
    /**
   * Initialize all services
   */
  async initialize() {
    if (this.isInitialized) {
      log.info('ServiceManager: Already initialized, skipping...');
      return;
    }

    try {
      this.isInitialized = true;
      log.info('ServiceManager: Starting service initialization...');

      // Register all services
      this.registerService('database', databaseService);
      this.registerService('tally', tallyService);
      this.registerService('excel', excelService);      // Set up service dependencies with logging
      this.setDependency('tally', ['database', 'logging']);
      this.setDependency('excel', ['logging']);
      this.setDependency('bugReport', ['logging']);

      // Initialize services in dependency order
      await this.initializeServices();

      // Integrate logging with all services after initialization
      this.integrateLoggingWithServices();

      // Start file monitoring
      this.startFileMonitoring();

      // Set up cleanup handlers
      this.setupCleanupHandlers();

      // Update statistics
      this.updateStatistics('initialization', { success: true });

      log.info('ServiceManager: All services initialized successfully');
      this.emit('initialized');

    } catch (error) {
      log.error('ServiceManager: Initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Register a service
   */
  registerService(name, service) {
    this.services.set(name, service);
    this.serviceStatus.set(name, 'registered');
    log.info(`ServiceManager: Registered service: ${name}`);
  }

  /**
   * Set service dependencies
   */
  setDependency(serviceName, dependencies) {
    this.dependencies.set(serviceName, dependencies);
  }

  /**
   * Initialize services in dependency order
   */
  async initializeServices() {
    const initialized = new Set();
    const initializing = new Set();

    const initService = async (serviceName) => {
      if (initialized.has(serviceName)) return;
      if (initializing.has(serviceName)) {
        throw new Error(`Circular dependency detected: ${serviceName}`);
      }

      initializing.add(serviceName);

      // Initialize dependencies first
      const deps = this.dependencies.get(serviceName) || [];
      for (const dep of deps) {
        await initService(dep);
      }

      // Initialize the service
      const service = this.services.get(serviceName);
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
        this.serviceStatus.set(serviceName, 'initialized');
        log.info(`ServiceManager: Initialized service: ${serviceName}`);
      }

      initializing.delete(serviceName);
      initialized.add(serviceName);
    };

    // Initialize all services
    for (const serviceName of this.services.keys()) {
      await initService(serviceName);
    }
  }

  /**
   * Start file monitoring for upload folder
   */
  startFileMonitoring() {
    try {
      this.fileWatcher = chokidar.watch(this.config.cleanup.uploadFolder, {
        ignored: /^\./, 
        persistent: true
      });

      this.fileWatcher
        .on('add', async (filePath) => {
          await this.trackUploadedFile(filePath);
        })
        .on('change', async (filePath) => {
          log.info(`File modified: ${filePath}`);
        })
        .on('unlink', async (filePath) => {
          await this.untrackFile(filePath);
        });

      log.info('ServiceManager: File monitoring started');
    } catch (error) {
      log.error('ServiceManager: Failed to start file monitoring:', error);
    }
  }

  /**
   * Track uploaded file
   */  async trackUploadedFile(filePath) {
    try {
      const fileId = uuidv4();
      const fileInfo = {
        id: fileId,
        path: filePath,
        name: path.basename(filePath),
        size: (await fs.stat(filePath)).size,
        uploadedAt: new Date().toISOString(),
        processed: false
      };

      // Ensure uploadedFiles path exists first
      this.ensureUploadedFilesPath();

      // Track uploaded file in database
      const uploadedFiles = this.fileTracker.getData('/uploadedFiles');
      uploadedFiles.push(fileInfo);
      this.fileTracker.push('/uploadedFiles', uploadedFiles);

      log.info(`ServiceManager: Tracked uploaded file: ${filePath}`);
      this.emit('fileUploaded', fileInfo);

      return fileId;
    } catch (error) {
      log.error('ServiceManager: Failed to track uploaded file:', error);
      throw error;
    }
  }

  /**
   * Untrack file
   */  async untrackFile(filePath) {
    try {
      // Ensure uploadedFiles path exists first
      this.ensureUploadedFilesPath();

      const uploadedFiles = this.fileTracker.getData('/uploadedFiles');
      const filteredFiles = uploadedFiles.filter(file => file.path !== filePath);
      this.fileTracker.push('/uploadedFiles', filteredFiles);

      log.info(`ServiceManager: Untracked file: ${filePath}`);
    } catch (error) {
      log.error('ServiceManager: Failed to untrack file:', error);
    }
  }

  /**
   * Setup cleanup handlers for application exit
   */
  setupCleanupHandlers() {
    const cleanup = async () => {
      if (this.config.cleanup.enabled) {
        await this.cleanupUploadedFiles();
      }
    };    // Handle different exit scenarios
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', async (error) => {
      log.error('Uncaught Exception:', error);
      await cleanup();
      process.exit(1);
    });

    // Note: Electron app events are handled in the main process
  }/**
   * Clean up uploaded files but preserve statistics
   */  async cleanupUploadedFiles() {
    try {
      log.info('ServiceManager: Starting cleanup of uploaded files...');      
      
      // Ensure uploadedFiles path exists first
      this.ensureUploadedFilesPath();

      // Get files to delete from database - use more reliable method
      let filesToDelete = [];
      try {
        const uploadedData = this.fileTracker.getData('/uploadedFiles');
        if (Array.isArray(uploadedData)) {
          filesToDelete = uploadedData;
        } else {
          log.info('ServiceManager: uploadedFiles data structure corrected');
          this.fileTracker.push('/uploadedFiles', []);
        }
      } catch (error) {
        log.info('ServiceManager: uploadedFiles path created');
        this.fileTracker.push('/uploadedFiles', []);
      }

      log.info(`ServiceManager: Found ${filesToDelete.length} files to process`);

      for (const file of filesToDelete) {
        try {
          if (await fsExtra.pathExists(file.path)) {
            await fsExtra.remove(file.path);
            log.info(`ServiceManager: Deleted file: ${file.path}`);
          }
        } catch (error) {
          log.error(`ServiceManager: Failed to delete file ${file.path}:`, error);
        }
      }

      // Clean temp folder
      await fsExtra.emptyDir(this.config.cleanup.tempFolder);

      // Update file tracker (clear uploaded files but keep structure)
      this.fileTracker.push('/uploadedFiles', []);
      this.fileTracker.push('/lastCleanup', new Date().toISOString());

      // NOTE: Dashboard statistics are preserved in dashboardStore

      log.info('ServiceManager: File cleanup completed');
      this.emit('filesCleanedUp');

    } catch (error) {
      log.error('ServiceManager: File cleanup failed:', error);
    }
  }

  /**
   * Update dashboard statistics (persistent)
   */
  updateDashboardStatistics(operation, data) {
    try {
      const stats = this.dashboardStore.get('statistics');
      
      switch (operation) {
        case 'sync':
          stats.totalSyncs += 1;
          stats.lastSyncDate = new Date().toISOString();
          if (data.success) {
            stats.successfulSyncs = (stats.successfulSyncs || 0) + 1;
          } else {
            stats.errorCount += 1;
          }
          stats.successRate = ((stats.successfulSyncs || 0) / stats.totalSyncs * 100).toFixed(2);
          break;

        case 'file':
          stats.totalFiles += data.count || 1;
          stats.totalRecords += data.records || 0;
          break;

        case 'performance':
          stats.avgProcessingTime = data.avgTime || stats.avgProcessingTime;
          stats.peakMemoryUsage = Math.max(stats.peakMemoryUsage, data.memory || 0);
          break;
      }

      this.dashboardStore.set('statistics', stats);
      this.emit('statisticsUpdated', stats);

    } catch (error) {
      log.error('ServiceManager: Failed to update dashboard statistics:', error);
    }
  }

  /**
   * Add recent activity (persistent)
   */
  addRecentActivity(activity) {
    try {
      const recentActivity = this.dashboardStore.get('recentActivity') || [];
      
      const newActivity = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        ...activity
      };

      recentActivity.unshift(newActivity);
      
      // Keep only last 50 activities
      if (recentActivity.length > 50) {
        recentActivity.splice(50);
      }

      this.dashboardStore.set('recentActivity', recentActivity);
      this.emit('activityAdded', newActivity);

    } catch (error) {
      log.error('ServiceManager: Failed to add recent activity:', error);
    }
  }

  /**
   * Get dashboard data
   */
  getDashboardData() {
    return {
      statistics: this.dashboardStore.get('statistics'),
      recentActivity: this.dashboardStore.get('recentActivity') || [],
      syncHistory: this.dashboardStore.get('syncHistory') || [],
      performance: this.dashboardStore.get('performance')
    };
  }

  /**
   * Update general statistics
   */
  updateStatistics(operation, data) {
    this.statistics.totalOperations += 1;
    
    if (data.success) {
      this.statistics.successes += 1;
    } else {
      this.statistics.errors += 1;
    }

    if (data.responseTime) {
      this.statistics.avgResponseTime = 
        (this.statistics.avgResponseTime + data.responseTime) / 2;
    }

    this.emit('statisticsUpdated', this.statistics);
  }

  /**
   * Get service by name
   */
  getService(name) {
    return this.services.get(name);
  }

  /**
   * Get all service statuses
   */
  getServiceStatuses() {
    const statuses = {};
    for (const [name, status] of this.serviceStatus.entries()) {
      statuses[name] = status;
    }
    return statuses;
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown() {
    try {
      log.info('ServiceManager: Starting graceful shutdown...');

      // Stop file monitoring
      if (this.fileWatcher) {
        this.fileWatcher.close();
      }

      // Cleanup files
      await this.cleanupUploadedFiles();

      // Shutdown services in reverse order
      const serviceNames = Array.from(this.services.keys()).reverse();
      for (const serviceName of serviceNames) {
        const service = this.services.get(serviceName);
        if (service && typeof service.shutdown === 'function') {
          await service.shutdown();
          this.serviceStatus.set(serviceName, 'shutdown');
          log.info(`ServiceManager: Shutdown service: ${serviceName}`);
        }
      }

      this.emit('shutdown');
      log.info('ServiceManager: Graceful shutdown completed');

    } catch (error) {
      log.error('ServiceManager: Shutdown failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced bug reporting and diagnostics
   */
  async generateBugReport(userDescription = '', includeSystemInfo = true) {
    try {
      const bugReport = {
        reportId: uuidv4(),
        timestamp: new Date().toISOString(),
        userDescription,
        version: this.appStore.get('version'),
        
        // System information
        system: includeSystemInfo ? {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          electronVersion: process.versions.electron,
          chromeVersion: process.versions.chrome,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        } : null,

        // Service statuses
        services: this.getServiceStatuses(),

        // Recent activity
        recentActivity: this.dashboardStore.get('recentActivity', []).slice(0, 10),

        // Error logs
        recentErrors: this.getRecentErrors(),

        // Performance metrics
        performance: this.getPerformanceMetrics(),

        // File system status
        storage: await this.getStorageInfo(),

        // Configuration (sanitized)
        config: this.getSanitizedConfig()
      };

      // Save bug report to local storage
      const reportsPath = path.join(this.config.storage.dataPath, 'bug-reports');
      await fsExtra.ensureDir(reportsPath);
      
      const reportFile = path.join(reportsPath, `bug-report-${bugReport.reportId}.json`);
      await fs.writeFile(reportFile, JSON.stringify(bugReport, null, 2));

      log.info(`ServiceManager: Bug report generated: ${bugReport.reportId}`);
      this.emit('bugReportGenerated', { reportId: bugReport.reportId, filePath: reportFile });

      return {
        success: true,
        reportId: bugReport.reportId,
        filePath: reportFile,
        report: bugReport
      };

    } catch (error) {
      log.error('ServiceManager: Failed to generate bug report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get recent error logs
   */
  getRecentErrors() {
    try {
      // This would integrate with your logging system
      const errors = [];
      
      // Add service-specific errors
      for (const [serviceName, service] of this.services) {
        if (service && typeof service.getRecentErrors === 'function') {
          const serviceErrors = service.getRecentErrors();
          errors.push(...serviceErrors.map(error => ({
            ...error,
            service: serviceName
          })));
        }
      }

      // Sort by timestamp and limit to last 20
      return errors
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

    } catch (error) {
      log.error('ServiceManager: Failed to get recent errors:', error);
      return [];
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.statistics,
      uptime: Date.now() - this.statistics.startTime,
      avgOperationTime: this.statistics.totalOperations > 0 ? 
        this.statistics.avgResponseTime / this.statistics.totalOperations : 0,
      successRate: this.statistics.totalOperations > 0 ? 
        (this.statistics.successes / this.statistics.totalOperations * 100).toFixed(2) : 100,
      dashboard: this.dashboardStore.get('performance'),
      memory: process.memoryUsage(),
      resourceUsage: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    };
  }

  /**
   * Get storage information
   */
  async getStorageInfo() {
    try {
      const storageInfo = {
        dataPath: this.config.storage.dataPath,
        uploadFolder: this.config.cleanup.uploadFolder,
        tempFolder: this.config.cleanup.tempFolder
      };

      // Get folder sizes
      for (const [key, folderPath] of Object.entries(storageInfo)) {
        try {
          const stats = await this.getFolderSize(folderPath);
          storageInfo[`${key}Size`] = stats.size;
          storageInfo[`${key}Files`] = stats.files;
        } catch (error) {
          storageInfo[`${key}Size`] = 0;
          storageInfo[`${key}Files`] = 0;
        }
      }

      return storageInfo;

    } catch (error) {
      log.error('ServiceManager: Failed to get storage info:', error);
      return {};
    }
  }

  /**
   * Get folder size recursively
   */
  async getFolderSize(folderPath) {
    let totalSize = 0;
    let totalFiles = 0;

    try {
      const items = await fs.readdir(folderPath);
      
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          const subFolderStats = await this.getFolderSize(itemPath);
          totalSize += subFolderStats.size;
          totalFiles += subFolderStats.files;
        } else {
          totalSize += stats.size;
          totalFiles++;
        }
      }
    } catch (error) {
      // Folder might not exist or be accessible
      return { size: 0, files: 0 };
    }

    return { size: totalSize, files: totalFiles };
  }

  /**
   * Get sanitized configuration (remove sensitive data)
   */
  getSanitizedConfig() {
    const config = JSON.parse(JSON.stringify(this.config));
    
    // Remove or mask sensitive information
    if (config.database && config.database.password) {
      config.database.password = '***';
    }
    
    return config;
  }

  /**
   * Enhanced data export functionality
   */
  async exportData(options = {}) {
    try {
      const {
        includeSettings = true,
        includeDashboard = true,
        includeHistory = true,
        includeErrors = false,
        format = 'json'
      } = options;

      const exportData = {
        exportId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: this.appStore.get('version')
      };

      if (includeSettings) {
        exportData.settings = this.appStore.store;
      }

      if (includeDashboard) {
        exportData.dashboard = this.dashboardStore.store;
      }      if (includeHistory) {
        exportData.fileHistory = this.fileTracker.getData('/');
      }

      if (includeErrors) {
        exportData.errors = this.getRecentErrors();
      }

      // Add performance metrics
      exportData.performance = this.getPerformanceMetrics();

      // Create export file
      const exportsPath = path.join(this.config.storage.dataPath, 'exports');
      await fsExtra.ensureDir(exportsPath);
      
      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const exportFile = path.join(exportsPath, `tallysyncpro-export-${timestamp}.${format}`);
      
      if (format === 'json') {
        await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      log.info(`ServiceManager: Data exported to: ${exportFile}`);
      this.emit('dataExported', { exportId: exportData.exportId, filePath: exportFile });

      return {
        success: true,
        exportId: exportData.exportId,
        filePath: exportFile,
        size: (await fs.stat(exportFile)).size
      };

    } catch (error) {
      log.error('ServiceManager: Data export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import data from export file
   */
  async importData(filePath, options = {}) {
    try {
      const {
        importSettings = true,
        importDashboard = true,
        importHistory = false,
        backup = true
      } = options;

      // Create backup before import
      if (backup) {
        await this.exportData({
          includeSettings: true,
          includeDashboard: true,
          includeHistory: true
        });
      }

      // Read import file
      const importContent = await fs.readFile(filePath, 'utf8');
      const importData = JSON.parse(importContent);

      const results = {
        importId: uuidv4(),
        timestamp: new Date().toISOString(),
        imported: {},
        errors: []
      };

      // Import settings
      if (importSettings && importData.settings) {
        try {
          // Merge with existing settings
          const currentSettings = this.appStore.store;
          const mergedSettings = { ...currentSettings, ...importData.settings };
          this.appStore.store = mergedSettings;
          results.imported.settings = true;
        } catch (error) {
          results.errors.push(`Settings import failed: ${error.message}`);
        }
      }

      // Import dashboard data
      if (importDashboard && importData.dashboard) {
        try {
          const currentDashboard = this.dashboardStore.store;
          const mergedDashboard = { ...currentDashboard, ...importData.dashboard };
          this.dashboardStore.store = mergedDashboard;
          results.imported.dashboard = true;
        } catch (error) {
          results.errors.push(`Dashboard import failed: ${error.message}`);
        }      }

      // Import file history
      if (importHistory && importData.fileHistory) {
        try {
          const currentData = this.fileTracker.getData('/');
          const mergedData = { ...currentData, ...importData.fileHistory };
          this.fileTracker.push('/', mergedData);
          results.imported.history = true;
        } catch (error) {
          results.errors.push(`History import failed: ${error.message}`);
        }
      }

      log.info(`ServiceManager: Data import completed: ${results.importId}`);
      this.emit('dataImported', results);

      return {
        success: true,
        results
      };

    } catch (error) {
      log.error('ServiceManager: Data import failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Advanced file cleanup with detailed reporting
   */
  async performAdvancedCleanup(options = {}) {
    try {
      const {
        cleanUploads = true,
        cleanTemp = true,
        cleanLogs = false,
        cleanBackups = false,
        olderThanDays = 0
      } = options;

      const cleanupResults = {
        cleanupId: uuidv4(),
        timestamp: new Date().toISOString(),
        results: {},
        totalFilesRemoved: 0,
        totalSizeFreed: 0,
        errors: []
      };

      const cutoffDate = olderThanDays > 0 ? 
        Date.now() - (olderThanDays * 24 * 60 * 60 * 1000) : 
        Date.now();

      // Clean uploads folder
      if (cleanUploads) {
        try {
          const result = await this.cleanupFolder(this.config.cleanup.uploadFolder, cutoffDate);
          cleanupResults.results.uploads = result;
          cleanupResults.totalFilesRemoved += result.filesRemoved;
          cleanupResults.totalSizeFreed += result.sizeFreed;
        } catch (error) {
          cleanupResults.errors.push(`Upload cleanup failed: ${error.message}`);
        }
      }

      // Clean temp folder
      if (cleanTemp) {
        try {
          const result = await this.cleanupFolder(this.config.cleanup.tempFolder, cutoffDate);
          cleanupResults.results.temp = result;
          cleanupResults.totalFilesRemoved += result.filesRemoved;
          cleanupResults.totalSizeFreed += result.sizeFreed;
        } catch (error) {
          cleanupResults.errors.push(`Temp cleanup failed: ${error.message}`);
        }
      }

      // Clean logs if requested
      if (cleanLogs) {
        try {
          const logsPath = path.join(this.config.storage.dataPath, 'logs');
          const result = await this.cleanupFolder(logsPath, cutoffDate);
          cleanupResults.results.logs = result;
          cleanupResults.totalFilesRemoved += result.filesRemoved;
          cleanupResults.totalSizeFreed += result.sizeFreed;
        } catch (error) {
          cleanupResults.errors.push(`Logs cleanup failed: ${error.message}`);
        }
      }

      // Clean backups if requested
      if (cleanBackups) {
        try {
          const backupsPath = path.join(this.config.storage.dataPath, 'backups');
          const result = await this.cleanupFolder(backupsPath, cutoffDate);
          cleanupResults.results.backups = result;
          cleanupResults.totalFilesRemoved += result.filesRemoved;
          cleanupResults.totalSizeFreed += result.sizeFreed;
        } catch (error) {
          cleanupResults.errors.push(`Backups cleanup failed: ${error.message}`);
        }
      }

      log.info(`ServiceManager: Advanced cleanup completed - ${cleanupResults.totalFilesRemoved} files, ${Math.round(cleanupResults.totalSizeFreed / 1024 / 1024)}MB freed`);
      this.emit('advancedCleanupCompleted', cleanupResults);

      return {
        success: true,
        results: cleanupResults
      };

    } catch (error) {
      log.error('ServiceManager: Advanced cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cleanup specific folder with detailed metrics
   */
  async cleanupFolder(folderPath, cutoffDate) {
    let filesRemoved = 0;
    let sizeFreed = 0;
    const errors = [];

    try {
      await fsExtra.ensureDir(folderPath);
      const items = await fs.readdir(folderPath);

      for (const item of items) {
        try {
          const itemPath = path.join(folderPath, item);
          const stats = await fs.stat(itemPath);

          if (stats.mtime.getTime() < cutoffDate) {
            sizeFreed += stats.size;
            await fs.unlink(itemPath);
            filesRemoved++;
          }
        } catch (error) {
          errors.push(`Failed to process ${item}: ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to access folder: ${error.message}`);
    }

    return {
      folderPath,
      filesRemoved,
      sizeFreed,
      errors
    };
  }

  /**
   * Integrate logging across all services
   */
  integrateLoggingWithServices() {
    if (!this.services.logging) return;

    const logger = this.services.logging;

    // Add logging wrapper to all service methods
    Object.keys(this.services).forEach(serviceName => {
      if (serviceName === 'logging') return;
      
      const service = this.services[serviceName];
      if (!service) return;

      // Wrap service methods with logging
      this.wrapServiceWithLogging(service, serviceName, logger);
    });

    logger.logInfo('ServiceManager', 'Integrated logging with all services');
  }

  /**
   * Wrap service methods with logging
   */
  wrapServiceWithLogging(service, serviceName, logger) {
    const originalMethods = {};
    
    // Get all methods of the service
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service))
      .filter(method => method !== 'constructor' && typeof service[method] === 'function');
    
    methods.forEach(methodName => {
      originalMethods[methodName] = service[methodName];
      
      service[methodName] = async (...args) => {
        const startTime = Date.now();
        
        try {
          logger.logDebug(serviceName, `Calling method: ${methodName}`);
          
          const result = await originalMethods[methodName].apply(service, args);
          const duration = Date.now() - startTime;
          
          logger.logInfo(serviceName, `Method ${methodName} completed in ${duration}ms`);
          
          return result;
          
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.logError(serviceName, `Method ${methodName} failed after ${duration}ms`, {
            error: error.message,
            stack: error.stack,
            args: args.length
          });
          
          throw error;
        }
      };
    });
  }

  /**
   * Get logging service for external use
   */
  getLogger() {
    return this.services.logging;
  }

  /**
   * Log service activity
   */
  async logActivity(serviceName, activity, status, metadata = {}) {
    if (this.services.logging) {
      await this.services.logging.logServiceActivity(serviceName, activity, status, metadata);
    }
  }
}

// Export singleton instance
const serviceManager = new ServiceManager();
module.exports = serviceManager;
