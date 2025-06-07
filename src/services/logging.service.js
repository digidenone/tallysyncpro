/**
 * ================================================================
 * TallySyncPro - Enhanced Logging Service
 * ================================================================
 * 
 * Comprehensive logging system with local file storage,
 * log rotation, filtering, and real-time monitoring
 * for TallySyncPro application.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');
const { app } = require('electron');
const log = require('electron-log');

class EnhancedLoggingService extends EventEmitter {
  constructor() {
    super();
    
    this.isInitialized = false;
    this.logsPath = '';
    this.currentLogFile = '';
    this.logQueue = [];
    this.isWriting = false;
    
    // Logging configuration
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 20,
      logLevel: 'info',
      enableConsole: true,
      enableFile: true,
      enableRealTime: true,
      rotateDaily: true,
      compressOldLogs: false
    };

    // Log levels
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    // Current session logs (for real-time display)
    this.sessionLogs = [];
    this.maxSessionLogs = 1000;

    // Statistics
    this.stats = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      sessionStart: Date.now(),
      lastLogTime: null
    };
  }

  /**
   * Initialize the logging service
   */
  async initialize() {
    try {
      log.info('LoggingService: Initializing logging service...');
      
      // Setup log directory
      this.logsPath = path.join(app.getPath('userData'), 'logs');
      await this.ensureLogDirectory();
      
      // Setup current log file
      await this.setupCurrentLogFile();
      
      // Configure electron-log for file output
      this.configureElectronLog();
      
      // Setup log rotation check
      this.setupLogRotation();
      
      // Start log queue processor
      this.startLogProcessor();
      
      this.isInitialized = true;
      this.emit('initialized');
      
      // Log initialization
      await this.logInfo('LoggingService', 'Logging service initialized successfully');
      
      return { success: true };
      
    } catch (error) {
      console.error('EnhancedLoggingService: Initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    try {
      await fs.access(this.logsPath);
    } catch {
      await fs.mkdir(this.logsPath, { recursive: true });
      console.log(`EnhancedLoggingService: Created logs directory: ${this.logsPath}`);
    }
  }

  /**
   * Setup current log file
   */
  async setupCurrentLogFile() {
    const today = moment().format('YYYY-MM-DD');
    this.currentLogFile = path.join(this.logsPath, `tallysyncpro-${today}.log`);
    
    // Create file if it doesn't exist
    try {
      await fs.access(this.currentLogFile);
    } catch {
      await fs.writeFile(this.currentLogFile, `# TallySyncPro Log File - ${moment().format('YYYY-MM-DD HH:mm:ss')}\n`);
    }
  }

  /**
   * Configure electron-log for file output
   */
  configureElectronLog() {
    // Set log file path
    log.transports.file.file = this.currentLogFile;
    log.transports.file.level = this.config.logLevel;
    log.transports.file.maxSize = this.config.maxFileSize;
    
    // Console transport
    log.transports.console.level = this.config.enableConsole ? this.config.logLevel : false;
    
    // Custom format
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {text}';
  }

  /**
   * Setup log rotation
   */
  setupLogRotation() {
    // Check for rotation every hour
    setInterval(() => {
      this.checkLogRotation().catch(error => {
        console.error('EnhancedLoggingService: Log rotation failed:', error);
      });
    }, 60 * 60 * 1000); // 1 hour

    // Daily rotation check
    if (this.config.rotateDaily) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.rotateLogs().catch(error => {
          console.error('EnhancedLoggingService: Daily rotation failed:', error);
        });
        
        // Set up daily interval
        setInterval(() => {
          this.rotateLogs().catch(error => {
            console.error('EnhancedLoggingService: Daily rotation failed:', error);
          });
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilMidnight);
    }
  }

  /**
   * Start log queue processor
   */
  startLogProcessor() {
    setInterval(() => {
      this.processLogQueue().catch(error => {
        console.error('EnhancedLoggingService: Log processing failed:', error);
      });
    }, 1000); // Process every second
  }

  /**
   * Process queued logs
   */
  async processLogQueue() {
    if (this.isWriting || this.logQueue.length === 0) {
      return;
    }

    this.isWriting = true;
    
    try {
      const logsToWrite = [...this.logQueue];
      this.logQueue = [];
      
      if (logsToWrite.length > 0) {
        const logText = logsToWrite.map(log => this.formatLogEntry(log)).join('\n') + '\n';
        await fs.appendFile(this.currentLogFile, logText);
        
        // Emit real-time log events
        logsToWrite.forEach(logEntry => {
          this.emit('logEntry', logEntry);
        });
      }
    } catch (error) {
      console.error('EnhancedLoggingService: Failed to write logs:', error);
      // Re-queue failed logs
      this.logQueue.unshift(...this.logQueue);
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Format log entry for file output
   */
  formatLogEntry(logEntry) {
    const timestamp = moment(logEntry.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS');
    const level = logEntry.level.toUpperCase().padEnd(5);
    const source = logEntry.source ? `[${logEntry.source}]` : '';
    
    return `[${timestamp}] [${level}] ${source} ${logEntry.message}`;
  }

  /**
   * Add log entry to queue
   */
  addLogEntry(level, source, message, metadata = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      metadata,
      sessionId: this.stats.sessionStart
    };

    // Add to queue for file writing
    this.logQueue.push(logEntry);
    
    // Add to session logs for real-time display
    this.sessionLogs.push(logEntry);
    if (this.sessionLogs.length > this.maxSessionLogs) {
      this.sessionLogs = this.sessionLogs.slice(-this.maxSessionLogs);
    }

    // Update statistics
    this.updateStats(level);
    
    // Also log to electron-log
    if (this.config.enableFile) {
      log[level](`[${source}] ${message}`);
    }
  }

  /**
   * Check if should log based on level
   */
  shouldLog(level) {
    const currentLevelValue = this.logLevels[this.config.logLevel] || 2;
    const messageLevelValue = this.logLevels[level] || 2;
    return messageLevelValue <= currentLevelValue;
  }

  /**
   * Update logging statistics
   */
  updateStats(level) {
    this.stats.totalLogs++;
    this.stats[`${level}Count`] = (this.stats[`${level}Count`] || 0) + 1;
    this.stats.lastLogTime = new Date().toISOString();
  }

  /**
   * Public logging methods
   */
  async logError(source, message, metadata = {}) {
    this.addLogEntry('error', source, message, metadata);
  }

  async logWarn(source, message, metadata = {}) {
    this.addLogEntry('warn', source, message, metadata);
  }

  async logInfo(source, message, metadata = {}) {
    this.addLogEntry('info', source, message, metadata);
  }

  async logDebug(source, message, metadata = {}) {
    this.addLogEntry('debug', source, metadata);
  }

  async logTrace(source, message, metadata = {}) {
    this.addLogEntry('trace', source, message, metadata);
  }

  /**
   * Log sync operation with detailed metadata
   */
  async logSyncOperation(operation, status, details = {}) {
    const metadata = {
      operation,
      status,
      duration: details.duration,
      recordCount: details.recordCount,
      errors: details.errors?.length || 0,
      ...details
    };

    const message = `Sync ${operation} ${status} - ${details.recordCount || 0} records in ${details.duration || 0}ms`;
    
    if (status === 'completed') {
      await this.logInfo('SyncOperation', message, metadata);
    } else if (status === 'failed') {
      await this.logError('SyncOperation', message, metadata);
    } else {
      await this.logDebug('SyncOperation', message, metadata);
    }
  }

  /**
   * Log service activity
   */
  async logServiceActivity(serviceName, activity, status, metadata = {}) {
    const message = `${serviceName} service: ${activity} - ${status}`;
    
    const logMetadata = {
      service: serviceName,
      activity,
      status,
      ...metadata
    };

    if (status === 'error' || status === 'failed') {
      await this.logError(serviceName, message, logMetadata);
    } else if (status === 'warning') {
      await this.logWarn(serviceName, message, logMetadata);
    } else {
      await this.logInfo(serviceName, message, logMetadata);
    }
  }

  /**
   * Check and perform log rotation
   */
  async checkLogRotation() {
    try {
      const stats = await fs.stat(this.currentLogFile);
      
      if (stats.size > this.config.maxFileSize) {
        await this.rotateLogs();
      }
    } catch (error) {
      console.error('EnhancedLoggingService: Failed to check log rotation:', error);
    }
  }

  /**
   * Rotate log files
   */
  async rotateLogs() {
    try {
      // Get current log files
      const files = await fs.readdir(this.logsPath);
      const logFiles = files
        .filter(file => file.startsWith('tallysyncpro-') && file.endsWith('.log'))
        .sort()
        .reverse();

      // Remove excess files
      if (logFiles.length >= this.config.maxFiles) {
        const filesToRemove = logFiles.slice(this.config.maxFiles - 1);
        for (const file of filesToRemove) {
          await fs.unlink(path.join(this.logsPath, file));
        }
      }

      // Setup new log file
      await this.setupCurrentLogFile();
      this.configureElectronLog();
      
      await this.logInfo('EnhancedLoggingService', 'Log rotation completed');
      
    } catch (error) {
      console.error('EnhancedLoggingService: Log rotation failed:', error);
    }
  }

  /**
   * Get recent logs for display
   */
  getRecentLogs(limit = 100, level = null) {
    let logs = [...this.sessionLogs];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Search logs
   */
  searchLogs(query, options = {}) {
    const {
      level = null,
      source = null,
      since = null,
      until = null,
      limit = 100
    } = options;

    let logs = [...this.sessionLogs];
    
    // Filter by level
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    // Filter by source
    if (source) {
      logs = logs.filter(log => log.source && log.source.includes(source));
    }
    
    // Filter by time range
    if (since) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(since));
    }
    
    if (until) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(until));
    }
    
    // Search in message
    if (query) {
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    return logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get log file paths
   */
  async getLogFiles() {
    try {
      const files = await fs.readdir(this.logsPath);
      const logFiles = files
        .filter(file => file.startsWith('tallysyncpro-') && file.endsWith('.log'))
        .sort()
        .reverse();

      const fileInfo = await Promise.all(
        logFiles.map(async file => {
          const filePath = path.join(this.logsPath, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );

      return fileInfo;
    } catch (error) {
      console.error('EnhancedLoggingService: Failed to get log files:', error);
      return [];
    }
  }

  /**
   * Export logs
   */
  async exportLogs(options = {}) {
    try {
      const {
        format = 'json',
        level = null,
        since = null,
        until = null,
        includeMetadata = true
      } = options;

      let logs = this.searchLogs('', { level, since, until, limit: 10000 });
      
      if (!includeMetadata) {
        logs = logs.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          source: log.source,
          message: log.message
        }));
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        totalLogs: logs.length,
        filters: { level, since, until },
        statistics: this.getLoggingStatistics(),
        logs
      };

      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const exportPath = path.join(this.logsPath, `logs-export-${timestamp}.${format}`);
      
      if (format === 'json') {
        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
      } else if (format === 'txt') {
        const textOutput = logs.map(log => this.formatLogEntry(log)).join('\n');
        await fs.writeFile(exportPath, textOutput);
      }

      await this.logInfo('EnhancedLoggingService', `Logs exported to ${exportPath}`);
      
      return {
        success: true,
        filePath: exportPath,
        logCount: logs.length
      };

    } catch (error) {
      await this.logError('EnhancedLoggingService', 'Log export failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get logging statistics
   */
  getLoggingStatistics() {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.sessionStart,
      currentLogFile: this.currentLogFile,
      sessionLogsCount: this.sessionLogs.length,
      averageLogsPerMinute: this.stats.totalLogs > 0 ? 
        (this.stats.totalLogs / ((Date.now() - this.stats.sessionStart) / 60000)).toFixed(2) : 0
    };
  }

  /**
   * Clear session logs
   */
  clearSessionLogs() {
    this.sessionLogs = [];
    this.emit('sessionLogsCleared');
  }

  /**
   * Update log level
   */
  setLogLevel(level) {
    if (this.logLevels.hasOwnProperty(level)) {
      this.config.logLevel = level;
      this.configureElectronLog();
      this.logInfo('EnhancedLoggingService', `Log level changed to: ${level}`);
    }
  }

  /**
   * Shutdown logging service
   */
  async shutdown() {
    try {
      // Process remaining queued logs
      await this.processLogQueue();
      
      await this.logInfo('EnhancedLoggingService', 'Logging service shutting down');
      
      // Final log processing
      await this.processLogQueue();
      
      this.emit('shutdown');
      
    } catch (error) {
      console.error('EnhancedLoggingService: Shutdown failed:', error);
    }
  }
}

module.exports = new EnhancedLoggingService();
