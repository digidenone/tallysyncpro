/**
 * Real-Time Data Service for TallySyncPro
 * 
 * Manages real-time tracking of application metrics including:
 * - Records synced
 * - Files processed
 * - Active sessions
 * - Sync performance
 * - Activity logs
 */

export interface DashboardMetrics {
  recordsSynced: number;
  filesProcessed: number;
  activeSessions: number;
  avgSyncSpeed: string;
  lastSyncTime: Date | null;
  totalSyncTime: number; // in milliseconds
  errorCount: number;
  successCount: number;
}

export interface ActivityItem {
  id: string;
  action: string;
  status: 'success' | 'error' | 'pending' | 'warning';
  time: Date;
  details?: string;
  recordCount?: number;
}

export interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'sync' | 'connection';
  status: 'pending' | 'in-progress' | 'success' | 'error';
  startTime: Date;
  endTime?: Date;
  recordCount?: number;
  fileName?: string;
  details?: string;
}

class RealTimeDataService {
  private metrics: DashboardMetrics = {
    recordsSynced: 0,
    filesProcessed: 0,
    activeSessions: 0,
    avgSyncSpeed: '0s',
    lastSyncTime: null,
    totalSyncTime: 0,
    errorCount: 0,
    successCount: 0
  };

  private activities: ActivityItem[] = [];
  private operations: Map<string, SyncOperation> = new Map();
  private subscribers: Set<(metrics: DashboardMetrics) => void> = new Set();
  private activitySubscribers: Set<(activities: ActivityItem[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // Subscription management
  subscribe(callback: (metrics: DashboardMetrics) => void): () => void {
    this.subscribers.add(callback);
    callback(this.metrics); // Send current state immediately
    return () => this.subscribers.delete(callback);
  }

  subscribeToActivity(callback: (activities: ActivityItem[]) => void): () => void {
    this.activitySubscribers.add(callback);
    callback(this.activities); // Send current state immediately
    return () => this.activitySubscribers.delete(callback);
  }

  // Core tracking methods
  startSyncOperation(type: SyncOperation['type'], fileName?: string): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: SyncOperation = {
      id,
      type,
      status: 'in-progress',
      startTime: new Date(),
      fileName
    };

    this.operations.set(id, operation);
    this.updateActiveSessions();
    this.addActivity({
      id: `activity_${id}`,
      action: this.getOperationLabel(type),
      status: 'pending',
      time: new Date(),
      details: fileName ? `Processing: ${fileName}` : undefined
    });

    return id;
  }

  completeSyncOperation(
    operationId: string, 
    success: boolean, 
    recordCount?: number, 
    details?: string
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.status = success ? 'success' : 'error';
    operation.endTime = new Date();
    operation.recordCount = recordCount;
    operation.details = details;

    const duration = operation.endTime.getTime() - operation.startTime.getTime();

    if (success) {
      this.metrics.successCount++;
      if (recordCount && recordCount > 0) {
        this.metrics.recordsSynced += recordCount;
      }
      if (operation.type === 'upload' || operation.type === 'sync') {
        this.metrics.filesProcessed++;
      }
      this.metrics.lastSyncTime = new Date();
      this.metrics.totalSyncTime += duration;
      this.updateAvgSyncSpeed();
    } else {
      this.metrics.errorCount++;
    }

    // Update activity
    this.addActivity({
      id: `activity_complete_${operationId}`,
      action: success 
        ? `${this.getOperationLabel(operation.type)} completed`
        : `${this.getOperationLabel(operation.type)} failed`,
      status: success ? 'success' : 'error',
      time: new Date(),
      details: details || (recordCount ? `${recordCount} records processed` : undefined),
      recordCount
    });

    this.operations.delete(operationId);
    this.updateActiveSessions();
    this.notifySubscribers();
    this.saveToStorage();
  }

  // Connection tracking
  updateConnectionStatus(connected: boolean): void {
    const wasConnected = this.metrics.activeSessions > 0;
    this.metrics.activeSessions = connected ? 1 : 0;

    if (connected && !wasConnected) {
      this.addActivity({
        id: `connection_${Date.now()}`,
        action: 'Connected to Tally ERP 9',
        status: 'success',
        time: new Date(),
        details: 'TallySyncPro service connected successfully'
      });
    } else if (!connected && wasConnected) {
      this.addActivity({
        id: `disconnection_${Date.now()}`,
        action: 'Disconnected from Tally ERP 9',
        status: 'warning',
        time: new Date(),
        details: 'Connection to Tally ERP 9 lost'
      });
    }

    this.notifySubscribers();
  }

  // Batch record update
  addRecordsBatch(count: number): void {
    this.metrics.recordsSynced += count;
    this.addActivity({
      id: `batch_${Date.now()}`,
      action: `Synced ${count} records`,
      status: 'success',
      time: new Date(),
      recordCount: count
    });
    this.notifySubscribers();
    this.saveToStorage();
  }

  // File processing
  processFile(fileName: string, recordCount: number): void {
    this.metrics.filesProcessed++;
    this.metrics.recordsSynced += recordCount;
    this.addActivity({
      id: `file_${Date.now()}`,
      action: `Processed file: ${fileName}`,
      status: 'success',
      time: new Date(),
      details: `${recordCount} records imported`,
      recordCount
    });
    this.notifySubscribers();
    this.saveToStorage();
  }

  // Error logging
  logError(message: string, details?: string): void {
    this.metrics.errorCount++;
    this.addActivity({
      id: `error_${Date.now()}`,
      action: 'Error occurred',
      status: 'error',
      time: new Date(),
      details: `${message}${details ? ': ' + details : ''}`
    });
    this.notifySubscribers();
    this.saveToStorage();
  }

  // Getters
  getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  getActivities(): ActivityItem[] {
    return [...this.activities];
  }

  getActiveOperations(): SyncOperation[] {
    return Array.from(this.operations.values()).filter(op => op.status === 'in-progress');
  }

  // Reset methods
  resetMetrics(): void {
    this.metrics = {
      recordsSynced: 0,
      filesProcessed: 0,
      activeSessions: this.metrics.activeSessions, // Keep current connection status
      avgSyncSpeed: '0s',
      lastSyncTime: null,
      totalSyncTime: 0,
      errorCount: 0,
      successCount: 0
    };
    this.activities = [];
    this.notifySubscribers();
    this.notifyActivitySubscribers();
    this.saveToStorage();
  }

  // Private helper methods
  private updateActiveSessions(): void {
    const activeCount = Array.from(this.operations.values())
      .filter(op => op.status === 'in-progress').length;
    // Don't override connection status, just count active operations
    if (activeCount > 0 && this.metrics.activeSessions === 0) {
      this.metrics.activeSessions = 1; // At least 1 if there are active operations
    }
  }

  private updateAvgSyncSpeed(): void {
    if (this.metrics.successCount > 0) {
      const avgTime = this.metrics.totalSyncTime / this.metrics.successCount;
      this.metrics.avgSyncSpeed = this.formatDuration(avgTime);
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  private getOperationLabel(type: SyncOperation['type']): string {
    switch (type) {
      case 'upload': return 'File Upload';
      case 'download': return 'Data Export';
      case 'sync': return 'Data Sync';
      case 'connection': return 'Connection Test';
      default: return 'Operation';
    }
  }

  private addActivity(activity: ActivityItem): void {
    this.activities.unshift(activity);
    // Keep only last 50 activities
    if (this.activities.length > 50) {
      this.activities = this.activities.slice(0, 50);
    }
    this.notifyActivitySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.metrics));
  }

  private notifyActivitySubscribers(): void {
    this.activitySubscribers.forEach(callback => callback(this.activities));
  }

  private saveToStorage(): void {
    try {
      const data = {
        metrics: this.metrics,
        activities: this.activities.slice(0, 20) // Save only recent activities
      };
      localStorage.setItem('tallysync_realtime_data', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save real-time data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('tallysync_realtime_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...data.metrics };
        this.activities = data.activities || [];
        // Reset active sessions on load
        this.metrics.activeSessions = 0;
      }
    } catch (error) {
      console.error('Failed to load real-time data:', error);
    }
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();
export default realTimeDataService;
