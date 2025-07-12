/**
 * ================================================================
 * TallySyncPro - Advanced Notification Service
 * ================================================================
 * 
 * Enterprise-level notification system for real-time updates

 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const { EventEmitter } = require('events');
const { Notification } = require('electron');
const log = require('electron-log');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    
    this.notifications = new Map();
    this.subscribers = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    
    this.config = {
      desktop: {
        enabled: true,
        silent: false,
        urgency: 'normal', // low, normal, critical
        icon: null
      },
      inApp: {
        enabled: true,
        position: 'top-right',
        duration: 5000,
        maxVisible: 5
      },
      sound: {
        enabled: true,
        success: 'success.wav',
        warning: 'warning.wav',
        error: 'error.wav',
        info: 'info.wav'
      },
      filters: {
        minLevel: 'info', // debug, info, warning, error, critical
        categories: ['all'],
        blacklist: []
      }
    };
    
    this.stats = {
      totalSent: 0,
      byType: {},
      byCategory: {},
      clickRate: 0,
      dismissRate: 0
    };
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      // Check notification permissions
      if (this.config.desktop.enabled) {
        await this.requestPermissions();
      }
      
      // Start processing queue
      this.startQueueProcessor();
      
      this.emit('initialized');
      log.info('NotificationService: Initialized successfully');
      
      return { success: true };
    } catch (error) {
      log.error('NotificationService: Initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Send notification with smart routing
   */
  async notify(type, title, message, options = {}) {
    const notification = {
      id: this.generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      category: options.category || 'general',
      level: options.level || 'info',
      urgent: options.urgent || false,
      persistent: options.persistent || false,
      actions: options.actions || [],
      data: options.data || {},
      source: options.source || 'system'
    };

    // Apply filters
    if (!this.shouldSendNotification(notification)) {
      return { success: false, reason: 'Filtered out' };
    }

    // Queue for processing
    this.notificationQueue.push(notification);
    
    // Process immediately if urgent
    if (notification.urgent) {
      await this.processNotification(notification);
    }

    this.emit('notificationQueued', notification);
    return { success: true, id: notification.id };
  }

  /**
   * Send success notification
   */
  async notifySuccess(title, message, options = {}) {
    return this.notify('success', title, message, {
      ...options,
      level: 'info'
    });
  }

  /**
   * Send error notification
   */
  async notifyError(title, message, options = {}) {
    return this.notify('error', title, message, {
      ...options,
      level: 'error',
      urgent: true
    });
  }

  /**
   * Send warning notification
   */
  async notifyWarning(title, message, options = {}) {
    return this.notify('warning', title, message, {
      ...options,
      level: 'warning'
    });
  }

  /**
   * Send info notification
   */
  async notifyInfo(title, message, options = {}) {
    return this.notify('info', title, message, {
      ...options,
      level: 'info'
    });
  }

  /**
   * Send progress notification
   */
  async notifyProgress(title, progress, options = {}) {
    const message = `${progress}% complete`;
    return this.notify('progress', title, message, {
      ...options,
      data: { progress },
      persistent: true,
      level: 'info'
    });
  }

  /**
   * Send sync status notification
   */
  async notifySyncStatus(status, details = {}) {
    const titles = {
      started: 'Sync Started',
      progress: 'Sync in Progress',
      completed: 'Sync Completed',
      failed: 'Sync Failed',
      cancelled: 'Sync Cancelled'
    };

    const types = {
      started: 'info',
      progress: 'info',
      completed: 'success',
      failed: 'error',
      cancelled: 'warning'
    };

    const message = this.formatSyncMessage(status, details);
    
    return this.notify(types[status], titles[status], message, {
      category: 'sync',
      data: details,
      persistent: status === 'failed'
    });
  }

  /**
   * Send automation update
   */
  async notifyAutomation(event, data = {}) {
    const messages = {
      started: 'Automation engine started',
      stopped: 'Automation engine stopped',
      workflowCreated: `Workflow "${data.name}" created`,
      workflowCompleted: `Workflow "${data.name}" completed`,
      workflowFailed: `Workflow "${data.name}" failed`,
      documentProcessed: 'Document processed automatically',
      conflictResolved: 'Data conflict resolved automatically'
    };

    return this.notify('automation', 'Automation Update', messages[event], {
      category: 'automation',
      data,
      level: event.includes('failed') ? 'error' : 'info'
    });
  }

  /**
   * Subscribe to specific notification types
   */
  subscribe(subscriber, filters = {}) {
    const subscriptionId = this.generateId();
    
    this.subscribers.set(subscriptionId, {
      id: subscriptionId,
      subscriber,
      filters: {
        types: filters.types || ['all'],
        categories: filters.categories || ['all'],
        levels: filters.levels || ['all'],
        sources: filters.sources || ['all']
      },
      callback: filters.callback,
      createdAt: new Date()
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(subscriptionId) {
    return this.subscribers.delete(subscriptionId);
  }

  /**
   * Get notification history
   */
  getHistory(filters = {}) {
    const { 
      limit = 50, 
      type = null, 
      category = null, 
      level = null,
      since = null 
    } = filters;

    let notifications = Array.from(this.notifications.values());

    // Apply filters
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }
    if (level) {
      notifications = notifications.filter(n => n.level === level);
    }
    if (since) {
      notifications = notifications.filter(n => n.timestamp >= new Date(since));
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    return notifications.slice(0, limit);
  }

  /**
   * Clear notifications
   */
  clearNotifications(filters = {}) {
    if (Object.keys(filters).length === 0) {
      // Clear all
      this.notifications.clear();
      return { cleared: 'all' };
    }

    // Clear filtered
    let cleared = 0;
    for (const [id, notification] of this.notifications) {
      if (this.matchesFilters(notification, filters)) {
        this.notifications.delete(id);
        cleared++;
      }
    }

    return { cleared };
  }

  /**
   * Get notification statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      queueLength: this.notificationQueue.length,
      totalStored: this.notifications.size,
      subscribers: this.subscribers.size,
      uptime: process.uptime()
    };
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      // In Electron, notifications should work by default
      return true;
    } catch (error) {
      log.warn('NotificationService: Permission request failed:', error);
      return false;
    }
  }

  /**
   * Start notification queue processor
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessing && this.notificationQueue.length > 0) {
        await this.processQueue();
      }
    }, 1000);
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      log.error('NotificationService: Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual notification
   */
  async processNotification(notification) {
    try {
      // Store notification
      this.notifications.set(notification.id, notification);

      // Send desktop notification
      if (this.config.desktop.enabled) {
        await this.sendDesktopNotification(notification);
      }

      // Send to subscribers
      await this.notifySubscribers(notification);

      // Update statistics
      this.updateStats(notification);

      this.emit('notificationSent', notification);

    } catch (error) {
      log.error('NotificationService: Failed to process notification:', error);
      this.emit('notificationError', { notification, error });
    }
  }

  /**
   * Send desktop notification
   */
  async sendDesktopNotification(notification) {
    try {
      const options = {
        title: notification.title,
        body: notification.message,
        silent: this.config.desktop.silent,
        urgency: notification.urgent ? 'critical' : this.config.desktop.urgency,
        icon: this.config.desktop.icon
      };

      const desktopNotification = new Notification(options);
      
      desktopNotification.on('click', () => {
        this.handleNotificationClick(notification);
      });

      desktopNotification.on('close', () => {
        this.handleNotificationClose(notification);
      });

      desktopNotification.show();

    } catch (error) {
      log.error('NotificationService: Desktop notification failed:', error);
    }
  }

  /**
   * Notify subscribers
   */
  async notifySubscribers(notification) {
    for (const [id, subscription] of this.subscribers) {
      try {
        if (this.matchesSubscription(notification, subscription)) {
          if (subscription.callback) {
            await subscription.callback(notification);
          }
          
          this.emit('subscriberNotified', {
            subscriptionId: id,
            notification
          });
        }
      } catch (error) {
        log.error(`NotificationService: Subscriber ${id} notification failed:`, error);
      }
    }
  }

  /**
   * Check if notification should be sent
   */
  shouldSendNotification(notification) {
    // Check level filter
    const levelPriority = { debug: 0, info: 1, warning: 2, error: 3, critical: 4 };
    const minLevel = levelPriority[this.config.filters.minLevel] || 1;
    const notificationLevel = levelPriority[notification.level] || 1;
    
    if (notificationLevel < minLevel) {
      return false;
    }

    // Check category filter
    if (!this.config.filters.categories.includes('all') && 
        !this.config.filters.categories.includes(notification.category)) {
      return false;
    }

    // Check blacklist
    if (this.config.filters.blacklist.includes(notification.type) ||
        this.config.filters.blacklist.includes(notification.category)) {
      return false;
    }

    return true;
  }

  /**
   * Check if notification matches subscription
   */
  matchesSubscription(notification, subscription) {
    const { filters } = subscription;

    // Check types
    if (!filters.types.includes('all') && !filters.types.includes(notification.type)) {
      return false;
    }

    // Check categories
    if (!filters.categories.includes('all') && !filters.categories.includes(notification.category)) {
      return false;
    }

    // Check levels
    if (!filters.levels.includes('all') && !filters.levels.includes(notification.level)) {
      return false;
    }

    // Check sources
    if (!filters.sources.includes('all') && !filters.sources.includes(notification.source)) {
      return false;
    }

    return true;
  }

  /**
   * Check if notification matches filters
   */
  matchesFilters(notification, filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (notification[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notification) {
    this.stats.clickRate++;
    this.emit('notificationClicked', notification);
  }

  /**
   * Handle notification close
   */
  handleNotificationClose(notification) {
    this.stats.dismissRate++;
    this.emit('notificationClosed', notification);
  }

  /**
   * Update statistics
   */
  updateStats(notification) {
    this.stats.totalSent++;
    this.stats.byType[notification.type] = (this.stats.byType[notification.type] || 0) + 1;
    this.stats.byCategory[notification.category] = (this.stats.byCategory[notification.category] || 0) + 1;
  }

  /**
   * Format sync message
   */
  formatSyncMessage(status, details) {
    switch (status) {
      case 'started':
        return `Syncing ${details.recordCount || 0} records to Tally`;
      case 'progress':
        return `${details.processed || 0} of ${details.total || 0} records synced`;
      case 'completed':
        return `Successfully synced ${details.successful || 0} records`;
      case 'failed':
        return `Sync failed: ${details.error || 'Unknown error'}`;
      case 'cancelled':
        return 'Sync operation was cancelled';
      default:
        return `Sync ${status}`;
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shutdown notification service
   */
  async shutdown() {
    // Process remaining notifications
    if (this.notificationQueue.length > 0) {
      await this.processQueue();
    }

    // Clear all subscribers
    this.subscribers.clear();

    this.emit('shutdown');
    log.info('NotificationService: Shutdown completed');
  }
}

module.exports = NotificationService;
