/**
 * ================================================================
 * TallySyncPro - Real-Time Data Service
 * ================================================================
 * 
 * Inspired by Suvit.io's seamless connectivity and real-time sync
 * Features:
 * - Live data synchronization
 * - Real-time notifications
 * - Automatic conflict resolution
 * - Multi-source data integration
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const moment = require('moment');

class RealTimeDataService extends EventEmitter {
  constructor() {
    super();
    
    this.isActive = false;
    this.connections = new Map();
    this.dataStreams = new Map();
    this.syncQueue = [];
    this.conflictResolver = null;
    
    this.config = {
      wsPort: 3001,
      syncInterval: 5000,
      maxRetries: 3,
      conflictResolution: 'timestamp', // 'timestamp', 'manual', 'merge'
      enableRealTimeSync: true,
      enableAutoBackup: true
    };
  }

  /**
   * Initialize real-time service
   */
  async initialize() {
    try {
      if (this.config.enableRealTimeSync) {
        await this.startWebSocketServer();
        this.startSyncEngine();
        this.setupConflictResolver();
      }
      
      this.isActive = true;
      this.emit('initialized');
      
      console.log('RealTimeDataService: Initialized successfully');
    } catch (error) {
      console.error('RealTimeDataService: Initialization failed:', error);
      this.emit('error', error);
    }
  }

  /**
   * Start WebSocket server for real-time communication
   */
  async startWebSocketServer() {
    this.wss = new WebSocket.Server({ port: this.config.wsPort });
    
    this.wss.on('connection', (ws, req) => {
      const connectionId = this.generateConnectionId();
      
      this.connections.set(connectionId, {
        ws,
        id: connectionId,
        connectedAt: new Date(),
        lastActivity: new Date(),
        subscriptions: new Set()
      });

      ws.on('message', async (message) => {
        await this.handleWebSocketMessage(connectionId, message);
      });

      ws.on('close', () => {
        this.connections.delete(connectionId);
        this.emit('clientDisconnected', connectionId);
      });

      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        connectionId,
        timestamp: new Date().toISOString(),
        status: 'connected'
      }));

      this.emit('clientConnected', connectionId);
    });

    console.log(`RealTimeDataService: WebSocket server started on port ${this.config.wsPort}`);
  }

  /**
   * Start the synchronization engine
   */
  startSyncEngine() {
    setInterval(async () => {
      if (this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
      
      // Check for pending data from Tally
      await this.checkTallyUpdates();
      
      // Send heartbeat to all connections
      this.sendHeartbeat();
      
    }, this.config.syncInterval);
  }

  /**
   * Add data to sync queue
   */
  queueDataSync(data, source = 'manual', priority = 'normal') {
    const syncItem = {
      id: this.generateSyncId(),
      data,
      source,
      priority,
      timestamp: new Date(),
      retries: 0,
      status: 'queued'
    };

    // Insert based on priority
    if (priority === 'high') {
      this.syncQueue.unshift(syncItem);
    } else {
      this.syncQueue.push(syncItem);
    }

    this.emit('dataSyncQueued', syncItem);
    
    // Broadcast to connected clients
    this.broadcast({
      type: 'syncQueued',
      data: {
        id: syncItem.id,
        source: syncItem.source,
        priority: syncItem.priority,
        queueLength: this.syncQueue.length
      }
    });

    return syncItem.id;
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    const batchSize = 5; // Process 5 items at a time
    const batch = this.syncQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        item.status = 'processing';
        
        this.broadcast({
          type: 'syncStarted',
          data: { id: item.id, source: item.source }
        });

        // Attempt to sync data
        const result = await this.syncDataToTally(item);
        
        if (result.success) {
          item.status = 'completed';
          this.emit('dataSyncCompleted', item);
          
          this.broadcast({
            type: 'syncCompleted',
            data: { 
              id: item.id, 
              source: item.source,
              result: result.summary 
            }
          });
        } else {
          throw new Error(result.error);
        }

      } catch (error) {
        item.retries++;
        
        if (item.retries < this.config.maxRetries) {
          item.status = 'retry';
          this.syncQueue.push(item); // Re-queue for retry
          
          this.broadcast({
            type: 'syncRetry',
            data: { 
              id: item.id, 
              attempt: item.retries,
              maxRetries: this.config.maxRetries,
              error: error.message 
            }
          });
        } else {
          item.status = 'failed';
          this.emit('dataSyncFailed', { item, error });
          
          this.broadcast({
            type: 'syncFailed',
            data: { 
              id: item.id, 
              source: item.source,
              error: error.message 
            }
          });
        }
      }
    }
  }

  /**
   * Sync data to Tally with conflict detection
   */
  async syncDataToTally(syncItem) {
    try {
      const { data } = syncItem;
      
      // Check for conflicts
      const conflicts = await this.detectConflicts(data);
      
      if (conflicts.length > 0) {
        const resolution = await this.resolveConflicts(conflicts, data);
        
        if (!resolution.canProceed) {
          return {
            success: false,
            error: 'Conflicts detected and cannot be auto-resolved',
            conflicts,
            requiresManualIntervention: true
          };
        }
        
        // Apply conflict resolution
        data = resolution.resolvedData;
      }

      // Proceed with sync to Tally
      const tallyResult = await this.performTallySync(data);
      
      if (tallyResult.success) {
        // Create backup if enabled
        if (this.config.enableAutoBackup) {
          await this.createSyncBackup(data, tallyResult);
        }
        
        return {
          success: true,
          summary: {
            recordsProcessed: tallyResult.recordCount,
            conflicts: conflicts.length,
            backupCreated: this.config.enableAutoBackup
          }
        };
      } else {
        return { success: false, error: tallyResult.error };
      }

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect data conflicts
   */
  async detectConflicts(newData) {
    const conflicts = [];
    
    // Check for duplicate voucher numbers
    if (newData.voucherNumber) {
      const existing = await this.checkExistingVoucher(newData.voucherNumber);
      if (existing) {
        conflicts.push({
          type: 'duplicate_voucher',
          field: 'voucherNumber',
          existing: existing,
          new: newData,
          severity: 'high'
        });
      }
    }

    // Check for ledger mismatches
    if (newData.ledgerName) {
      const ledgerExists = await this.checkLedgerExists(newData.ledgerName);
      if (!ledgerExists) {
        conflicts.push({
          type: 'missing_ledger',
          field: 'ledgerName',
          value: newData.ledgerName,
          severity: 'medium',
          suggestion: 'Create ledger automatically or map to existing ledger'
        });
      }
    }

    // Check for date range conflicts
    if (newData.date) {
      const dateConflict = await this.checkDateRangeConflict(newData.date);
      if (dateConflict) {
        conflicts.push({
          type: 'date_range_conflict',
          field: 'date',
          value: newData.date,
          severity: 'low',
          suggestion: dateConflict.suggestion
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts automatically or queue for manual resolution
   */
  async resolveConflicts(conflicts, data) {
    const resolution = {
      canProceed: true,
      resolvedData: { ...data },
      actions: []
    };

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'duplicate_voucher':
          if (this.config.conflictResolution === 'timestamp') {
            // Use most recent timestamp
            if (new Date(data.timestamp) > new Date(conflict.existing.timestamp)) {
              resolution.actions.push('Updated existing voucher with newer data');
            } else {
              resolution.canProceed = false;
              resolution.reason = 'Existing voucher is newer';
            }
          } else {
            resolution.canProceed = false;
            resolution.reason = 'Manual intervention required for duplicate voucher';
          }
          break;

        case 'missing_ledger':
          // Auto-create ledger if possible
          const newLedger = await this.autoCreateLedger(conflict.value);
          if (newLedger.success) {
            resolution.actions.push(`Auto-created ledger: ${conflict.value}`);
          } else {
            resolution.canProceed = false;
            resolution.reason = 'Cannot auto-create required ledger';
          }
          break;

        case 'date_range_conflict':
          // Log warning but proceed
          resolution.actions.push(`Date range warning: ${conflict.suggestion}`);
          break;
      }
    }

    return resolution;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message) {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    this.connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
        connection.lastActivity = new Date();
      }
    });
  }

  /**
   * Send heartbeat to maintain connections
   */
  sendHeartbeat() {
    this.broadcast({
      type: 'heartbeat',
      serverTime: new Date().toISOString(),
      activeConnections: this.connections.size,
      queueLength: this.syncQueue.length
    });
  }

  /**
   * Check for updates from Tally
   */
  async checkTallyUpdates() {
    try {
      // Implementation would check Tally for new/updated records
      // and push updates to connected clients
      
      const updates = await this.getTallyUpdates();
      
      if (updates.length > 0) {
        this.broadcast({
          type: 'tallyUpdates',
          data: updates
        });
      }
    } catch (error) {
      console.error('Error checking Tally updates:', error);
    }
  }

  /**
   * Handle WebSocket messages
   */
  async handleWebSocketMessage(connectionId, message) {
    try {
      const data = JSON.parse(message);
      const connection = this.connections.get(connectionId);
      
      if (!connection) return;

      switch (data.type) {
        case 'subscribe':
          connection.subscriptions.add(data.channel);
          connection.ws.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel,
            timestamp: new Date().toISOString()
          }));
          break;

        case 'unsubscribe':
          connection.subscriptions.delete(data.channel);
          break;

        case 'syncData':
          const syncId = this.queueDataSync(data.payload, 'realtime', data.priority);
          connection.ws.send(JSON.stringify({
            type: 'syncQueued',
            syncId,
            timestamp: new Date().toISOString()
          }));
          break;

        case 'ping':
          connection.ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;
      }

      connection.lastActivity = new Date();
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Utility methods
   */
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async checkExistingVoucher(voucherNumber) {
    // Implementation would check Tally for existing voucher
    return null;
  }

  async checkLedgerExists(ledgerName) {
    // Implementation would check Tally for existing ledger
    return true;
  }

  async checkDateRangeConflict(date) {
    // Implementation would check for date range issues
    return null;
  }

  async autoCreateLedger(ledgerName) {
    // Implementation would create ledger in Tally
    return { success: true };
  }

  async performTallySync(data) {
    // Implementation would sync to Tally using existing service
    return { success: true, recordCount: 1 };
  }

  async createSyncBackup(data, result) {
    // Implementation would create backup
    return { success: true };
  }

  async getTallyUpdates() {
    // Implementation would fetch updates from Tally
    return [];
  }

  setupConflictResolver() {
    // Setup conflict resolution strategies
    this.conflictResolver = {
      strategies: {
        timestamp: 'Use most recent timestamp',
        manual: 'Require manual intervention',
        merge: 'Attempt to merge data'
      },
      current: this.config.conflictResolution
    };
  }

  /**
   * Public API
   */
  getConnectionStats() {
    return {
      activeConnections: this.connections.size,
      queueLength: this.syncQueue.length,
      isActive: this.isActive,
      uptime: process.uptime()
    };
  }

  async shutdown() {
    this.isActive = false;
    
    // Close all WebSocket connections
    this.connections.forEach((connection) => {
      connection.ws.close();
    });
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    this.emit('shutdown');
    console.log('RealTimeDataService: Shutdown completed');
  }
}

module.exports = RealTimeDataService;
