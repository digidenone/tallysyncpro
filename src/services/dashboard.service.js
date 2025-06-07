/**
 * ================================================================
 * TallySyncPro - Dashboard Service
 * ================================================================
 * 
 * Manages dashboard data, statistics, and persistent storage
 * for comprehensive application monitoring and analytics.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const EventEmitter = require('events');
const Store = require('electron-store');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');

class DashboardService extends EventEmitter {
  constructor() {
    super();
    
    // Initialize persistent storage for dashboard data
    this.store = new Store({
      name: 'tallysyncpro-dashboard',
      defaults: {
        statistics: {
          totalSyncs: 0,
          successfulSyncs: 0,
          totalFiles: 0,
          totalRecords: 0,
          lastSyncDate: null,
          firstUse: new Date().toISOString(),
          avgProcessingTime: 0,
          errorCount: 0,
          successRate: 100,
          totalUptime: 0,
          sessionsCount: 0
        },
        recentActivity: [],
        syncHistory: [],
        performance: {
          memoryUsage: [],
          cpuUsage: [],
          networkLatency: [],
          diskUsage: []
        },
        preferences: {
          refreshInterval: 5000,
          maxActivities: 100,
          chartDuration: 30, // days
          enableNotifications: true
        },
        insights: {
          patterns: [],
          recommendations: [],
          alerts: []
        }
      }
    });

    // Enhanced configuration for dashboard features
    this.config = {
      updateInterval: 5000, // 5 seconds
      historyRetention: 30, // days
      maxErrorLogEntries: 500,
      maxSyncHistoryEntries: 1000,
      enableRealTimeUpdates: true,
      enablePerformanceMonitoring: true,
      autoSaveInterval: 30000 // 30 seconds
    };

    this.sessionStartTime = Date.now();
    this.performanceTimer = null;
    
    // Real-time metrics tracking
    this.realTimeMetrics = {
      activeOperations: 0,
      queuedOperations: 0,
      peakMemoryUsage: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0,
      lastUpdated: Date.now()
    };

    // Data storage for different components
    this.componentData = {
      charts: {},
      widgets: {},
      reports: {},
      alerts: []
    };

    // Performance monitoring state
    this.lastCpuUsage = null;
    this.performanceInterval = null;
    this.healthInterval = null;
    this.persistenceInterval = null;
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Get complete dashboard data
   */
  getDashboardData() {
    const statistics = this.getStatistics();
    const recentActivity = this.getRecentActivity();
    const syncHistory = this.getSyncHistory();
    const performance = this.getPerformanceMetrics();
    const insights = this.getInsights();

    return {
      statistics,
      recentActivity,
      syncHistory,
      performance,
      insights,
      sessionInfo: {
        startTime: this.sessionStartTime,
        uptime: Date.now() - this.sessionStartTime
      }
    };
  }

  /**
   * Get current statistics
   */
  getStatistics() {
    const stats = this.store.get('statistics');
    
    // Calculate real-time metrics
    const now = Date.now();
    const sessionUptime = now - this.sessionStartTime;
    const totalUptime = stats.totalUptime + sessionUptime;
    
    return {
      ...stats,
      currentSessionUptime: sessionUptime,
      totalUptime,
      lastUpdated: now
    };
  }

  /**
   * Update statistics
   */
  updateStatistics(operation, data = {}) {
    const stats = this.store.get('statistics');
    
    switch (operation) {
      case 'sync':
        stats.totalSyncs += 1;
        if (data.success) {
          stats.successfulSyncs += 1;
        } else {
          stats.errorCount += 1;
        }
        stats.lastSyncDate = new Date().toISOString();
        stats.successRate = stats.totalSyncs > 0 ? 
          ((stats.successfulSyncs / stats.totalSyncs) * 100).toFixed(2) : 100;
        
        if (data.processingTime) {
          stats.avgProcessingTime = stats.avgProcessingTime === 0 ? 
            data.processingTime : 
            ((stats.avgProcessingTime + data.processingTime) / 2);
        }
        break;

      case 'file':
        stats.totalFiles += (data.count || 1);
        stats.totalRecords += (data.records || 0);
        break;

      case 'session':
        stats.sessionsCount += 1;
        break;

      case 'error':
        stats.errorCount += 1;
        break;
    }

    this.store.set('statistics', stats);
    this.emit('statisticsUpdated', stats);
    
    log.info(`DashboardService: Updated statistics for ${operation}`);
  }

  /**
   * Add activity to recent activity log
   */
  addActivity(activity) {
    const activities = this.store.get('recentActivity') || [];
    
    const newActivity = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      session: this.sessionStartTime,
      ...activity
    };

    activities.unshift(newActivity);
    
    // Keep only the latest activities based on preferences
    const maxActivities = this.store.get('preferences.maxActivities') || 100;
    if (activities.length > maxActivities) {
      activities.splice(maxActivities);
    }

    this.store.set('recentActivity', activities);
    this.emit('activityAdded', newActivity);
    
    return newActivity;
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit = 20) {
    const activities = this.store.get('recentActivity') || [];
    return activities.slice(0, limit);
  }

  /**
   * Add sync operation to history
   */
  addSyncHistory(syncData) {
    const history = this.store.get('syncHistory') || [];
    
    const syncRecord = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      duration: syncData.duration || 0,
      recordsProcessed: syncData.recordsProcessed || 0,
      success: syncData.success || false,
      error: syncData.error || null,
      fileInfo: syncData.fileInfo || null,
      tallyInfo: syncData.tallyInfo || null
    };

    history.unshift(syncRecord);
    
    // Keep only last 500 sync records
    if (history.length > 500) {
      history.splice(500);
    }

    this.store.set('syncHistory', history);
    this.emit('syncHistoryUpdated', syncRecord);
    
    return syncRecord;
  }

  /**
   * Get sync history
   */
  getSyncHistory(limit = 50) {
    const history = this.store.get('syncHistory') || [];
    return history.slice(0, limit);
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    this.performanceTimer = setInterval(() => {
      this.recordPerformanceMetrics();
    }, 30000); // Record every 30 seconds
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetrics() {
    try {
      const performance = this.store.get('performance') || {};
      const now = new Date().toISOString();
      
      // Memory usage
      const memoryUsage = process.memoryUsage();
      if (!performance.memoryUsage) performance.memoryUsage = [];
      performance.memoryUsage.push({
        timestamp: now,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      });

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      if (!performance.cpuUsage) performance.cpuUsage = [];
      performance.cpuUsage.push({
        timestamp: now,
        user: cpuUsage.user,
        system: cpuUsage.system
      });

      // Keep only last 24 hours of data (720 entries at 30s intervals = 6 hours)
      const maxEntries = 720;
      Object.keys(performance).forEach(key => {
        if (Array.isArray(performance[key]) && performance[key].length > maxEntries) {
          performance[key] = performance[key].slice(-maxEntries);
        }
      });

      this.store.set('performance', performance);
      this.emit('performanceUpdated', performance);

    } catch (error) {
      log.error('DashboardService: Failed to record performance metrics:', error);
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.store.get('performance') || {};
  }

  /**
   * Generate insights and recommendations
   */
  generateInsights() {
    const stats = this.getStatistics();
    const history = this.getSyncHistory(100);
    const insights = {
      patterns: [],
      recommendations: [],
      alerts: [],
      generatedAt: new Date().toISOString()
    };

    // Success rate analysis
    if (stats.successRate < 90) {
      insights.alerts.push({
        type: 'warning',
        title: 'Low Success Rate',
        message: `Sync success rate is ${stats.successRate}%. Consider checking your Tally connection.`,
        action: 'Check connection settings'
      });
    }

    // Usage patterns
    if (stats.totalSyncs > 50) {
      const avgPerDay = stats.totalSyncs / moment().diff(moment(stats.firstUse), 'days');
      insights.patterns.push({
        type: 'usage',
        title: 'Sync Frequency',
        value: avgPerDay.toFixed(1),
        description: 'Average syncs per day'
      });
    }

    // Performance recommendations
    if (stats.avgProcessingTime > 30000) { // > 30 seconds
      insights.recommendations.push({
        type: 'performance',
        title: 'Optimize Processing Time',
        message: 'Consider breaking large files into smaller chunks for better performance.',
        priority: 'medium'
      });
    }

    // Error analysis
    const recentErrors = history.filter(h => !h.success && 
      moment(h.timestamp).isAfter(moment().subtract(7, 'days'))
    ).length;
    
    if (recentErrors > 5) {
      insights.alerts.push({
        type: 'error',
        title: 'High Error Rate',
        message: `${recentErrors} sync errors in the last 7 days.`,
        action: 'Review error logs'
      });
    }

    this.store.set('insights', insights);
    return insights;
  }

  /**
   * Get insights
   */
  getInsights() {
    return this.store.get('insights') || { patterns: [], recommendations: [], alerts: [] };
  }

  /**
   * Update preferences
   */
  updatePreferences(newPreferences) {
    const currentPrefs = this.store.get('preferences');
    const updatedPrefs = { ...currentPrefs, ...newPreferences };
    this.store.set('preferences', updatedPrefs);
    this.emit('preferencesUpdated', updatedPrefs);
  }

  /**
   * Get preferences
   */
  getPreferences() {
    return this.store.get('preferences');
  }

  /**
   * Clear dashboard data (with confirmation)
   */
  clearData(dataType = 'all') {
    switch (dataType) {
      case 'activities':
        this.store.set('recentActivity', []);
        break;
      case 'history':
        this.store.set('syncHistory', []);
        break;
      case 'performance':
        this.store.set('performance', {});
        break;
      case 'all':
        this.store.clear();
        break;
    }
    
    this.emit('dataCleared', dataType);
    log.info(`DashboardService: Cleared ${dataType} data`);
  }

  /**
   * Export dashboard data
   */
  exportData() {
    const data = {
      statistics: this.getStatistics(),
      recentActivity: this.getRecentActivity(1000), // Export more for backup
      syncHistory: this.getSyncHistory(1000),
      performance: this.getPerformanceMetrics(),
      insights: this.getInsights(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return data;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
    }

    // Update total uptime
    const stats = this.store.get('statistics');
    const sessionUptime = Date.now() - this.sessionStartTime;
    stats.totalUptime = (stats.totalUptime || 0) + sessionUptime;
    this.store.set('statistics', stats);

    this.emit('shutdown');
    log.info('DashboardService: Service shutdown completed');
  }
}

module.exports = new DashboardService();
