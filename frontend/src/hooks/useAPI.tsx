/**
 * ================================================================
 * TallySyncPro - API Hook for React Frontend
 * ================================================================
 * 
 * React hook that provides a clean interface to interact with
 * the backend services through Electron IPC.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

// Define types for our API
interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electron?: {
      ipcRenderer: ElectronAPI;
    };
  }
}

// IPC API interface
const api = window.electronAPI || window.electron?.ipcRenderer;

export const useAPI = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef(new Map());

  // Initialize connection check
  useEffect(() => {
    if (api) {
      setIsConnected(true);
    } else {
      console.error('API not available');
      toast({
        title: "Connection Error",
        description: "Unable to connect to backend services",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Generic API call wrapper
   */
  const apiCall = useCallback(async (endpoint, ...args) => {
    if (!api) {
      throw new Error('API not available');
    }

    try {
      const result = await api.invoke(endpoint, ...args);
      
      if (!result.success) {
        throw new Error(result.error || 'API call failed');
      }
      
      return result.data;
    } catch (error) {
      console.error(`API call failed [${endpoint}]:`, error);
      throw error;
    }
  }, []);

  /**
   * Dashboard API methods
   */
  const dashboard = {
    // Get dashboard statistics
    getStats: useCallback(async () => {
      return await apiCall('api:dashboard:getStats');
    }, [apiCall]),

    // Get chart data
    getChartData: useCallback(async (options = {}) => {
      return await apiCall('api:dashboard:getChartData', options);
    }, [apiCall]),

    // Get recent activities
    getRecentActivities: useCallback(async (limit = 20) => {
      return await apiCall('api:dashboard:getRecentActivities', limit);
    }, [apiCall])
  };

  /**
   * Data processing API methods
   */
  const dataProcessing = {
    // Upload and process file
    uploadFile: useCallback(async (filePath) => {
      return await apiCall('api:data:uploadFile', filePath);
    }, [apiCall]),

    // Get data preview
    getPreview: useCallback(async (fileId, options = {}) => {
      return await apiCall('api:data:getPreview', fileId, options);
    }, [apiCall]),

    // Validate data
    validate: useCallback(async (fileId, validationRules = {}) => {
      return await apiCall('api:data:validate', fileId, validationRules);
    }, [apiCall]),

    // Get data summary
    getSummary: useCallback(async (fileId) => {
      return await apiCall('api:data:getSummary', fileId);
    }, [apiCall])
  };

  /**
   * Tally sync API methods
   */
  const tallySync = {
    // Test Tally connection
    testConnection: useCallback(async (config) => {
      return await apiCall('api:tally:testConnection', config);
    }, [apiCall]),

    // Start sync operation
    startSync: useCallback(async (syncConfig) => {
      return await apiCall('api:tally:startSync', syncConfig);
    }, [apiCall]),

    // Get sync status
    getSyncStatus: useCallback(async (syncId) => {
      return await apiCall('api:tally:getSyncStatus', syncId);
    }, [apiCall]),

    // Cancel sync operation
    cancelSync: useCallback(async (syncId) => {
      return await apiCall('api:tally:cancelSync', syncId);
    }, [apiCall]),

    // Get sync history
    getSyncHistory: useCallback(async (options = {}) => {
      return await apiCall('api:tally:getSyncHistory', options);
    }, [apiCall])
  };

  /**
   * Logging API methods
   */
  const logging = {
    // Get recent logs
    getRecent: useCallback(async (options = {}) => {
      return await apiCall('api:logs:getRecent', options);
    }, [apiCall]),

    // Search logs
    search: useCallback(async (query, options = {}) => {
      return await apiCall('api:logs:search', query, options);
    }, [apiCall]),

    // Get logging statistics
    getStats: useCallback(async () => {
      return await apiCall('api:logs:getStats');
    }, [apiCall]),

    // Export logs
    export: useCallback(async (options = {}) => {
      return await apiCall('api:logs:export', options);
    }, [apiCall]),

    // Set log level
    setLevel: useCallback(async (level) => {
      return await apiCall('api:logs:setLevel', level);
    }, [apiCall]),

    // Clear session logs
    clearSession: useCallback(async () => {
      return await apiCall('api:logs:clearSession');
    }, [apiCall])
  };

  /**
   * File management API methods
   */
  const files = {
    // Select file dialog
    selectFile: useCallback(async (options = {}) => {
      return await apiCall('api:files:selectFile', options);
    }, [apiCall]),

    // Get file information
    getInfo: useCallback(async (filePath) => {
      return await apiCall('api:files:getInfo', filePath);
    }, [apiCall]),

    // Open file location
    openLocation: useCallback(async (filePath) => {
      return await apiCall('api:files:openLocation', filePath);
    }, [apiCall]),

    // Get download templates
    getTemplates: useCallback(async () => {
      return await apiCall('api:files:getTemplates');
    }, [apiCall])
  };

  /**
   * System API methods
   */
  const system = {
    // Get system information
    getInfo: useCallback(async () => {
      return await apiCall('api:system:getInfo');
    }, [apiCall]),

    // Get system health
    getHealth: useCallback(async () => {
      return await apiCall('api:system:getHealth');
    }, [apiCall]),

    // Generate bug report
    generateBugReport: useCallback(async (description) => {
      return await apiCall('api:system:generateBugReport', description);
    }, [apiCall]),

    // Cleanup temporary files
    cleanup: useCallback(async () => {
      return await apiCall('api:system:cleanup');
    }, [apiCall])
  };

  /**
   * Configuration API methods
   */
  const config = {
    // Get configuration
    get: useCallback(async (key) => {
      return await apiCall('api:config:get', key);
    }, [apiCall]),

    // Set configuration
    set: useCallback(async (key, value) => {
      return await apiCall('api:config:set', key, value);
    }, [apiCall]),

    // Reset configuration
    reset: useCallback(async (key) => {
      return await apiCall('api:config:reset', key);
    }, [apiCall])
  };

  /**
   * Subscribe to real-time events
   */
  const subscribe = useCallback((event, callback) => {
    if (!api) return () => {};

    // Store subscription
    const unsubscribe = () => {
      if (api.removeListener) {
        api.removeListener(event, callback);
      }
      subscriptionsRef.current.delete(event);
    };

    subscriptionsRef.current.set(event, unsubscribe);

    // Add listener
    if (api.on) {
      api.on(event, callback);
    }

    return unsubscribe;
  }, []);

  /**
   * Cleanup subscriptions on unmount
   */
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(unsubscribe => {
        unsubscribe();
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    dashboard,
    dataProcessing,
    tallySync,
    logging,
    files,
    system,
    config,
    subscribe,
    apiCall
  };
};

// Define types for our data structures
interface DashboardStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: string;
  [key: string]: any;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  source: string;
  message: string;
  metadata?: any;
}

interface SyncStatus {
  id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
  [key: string]: any;
}

/**
 * Hook for dashboard data with auto-refresh
 */
export const useDashboard = (refreshInterval = 30000) => {
  const api = useAPI();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    if (!api.isConnected) return;

    try {
      setIsLoading(true);
      setError(null);

      const [statsData, chartData, activities] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getChartData(),
        api.dashboard.getRecentActivities()
      ]);

      setStats(statsData);
      setChartData(chartData);
      setRecentActivities(activities);

    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshData();

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = api.subscribe('dashboard:statsUpdated', (newStats) => {
      setStats(prev => ({ ...prev, ...newStats }));
    });

    return unsubscribe;
  }, [api]);

  return {
    stats,
    chartData,
    recentActivities,
    isLoading,
    error,
    refresh: refreshData
  };
};

/**
 * Hook for real-time logging
 */
export const useRealTimeLogs = (maxLogs = 100) => {
  const api = useAPI();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Load initial logs
  useEffect(() => {
    if (!api.isConnected) return;

    const loadInitialLogs = async () => {
      try {
        const [recentLogs, logsStats] = await Promise.all([
          api.logging.getRecent({ limit: maxLogs }),
          api.logging.getStats()
        ]);

        setLogs(recentLogs);
        setStats(logsStats);
      } catch (error) {
        console.error('Failed to load initial logs:', error);
      }
    };

    loadInitialLogs();
  }, [api, maxLogs]);

  // Subscribe to new log entries
  useEffect(() => {
    const unsubscribe = api.subscribe('logs:newEntry', (newLog) => {
      setLogs(prev => {
        const updated = [newLog, ...prev];
        return updated.slice(0, maxLogs);
      });
    });

    return unsubscribe;
  }, [api, maxLogs]);

  const clearLogs = useCallback(async () => {
    try {
      await api.logging.clearSession();
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }, [api]);

  const exportLogs = useCallback(async (options = {}) => {
    try {
      return await api.logging.export(options);
    } catch (error) {
      console.error('Failed to export logs:', error);
      throw error;
    }
  }, [api]);

  return {
    logs,
    stats,
    clearLogs,
    exportLogs,
    searchLogs: api.logging.search,
    setLogLevel: api.logging.setLevel
  };
};

/**
 * Hook for Tally sync operations
 */
export const useTallySync = () => {
  const api = useAPI();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to sync events
  useEffect(() => {    const unsubscribeProgress = api.subscribe('tally:syncProgress', (progress) => {
      setSyncStatus(prev => prev ? { ...prev, ...progress } : progress);
    });

    const unsubscribeCompleted = api.subscribe('tally:syncCompleted', (result) => {
      setSyncStatus(result);
      // Refresh history
      loadSyncHistory();
    });

    const unsubscribeError = api.subscribe('tally:syncError', (error) => {
      setSyncStatus(prev => prev ? { ...prev, error: error.message } : { status: 'failed', error: error.message });
    });

    return () => {
      unsubscribeProgress();
      unsubscribeCompleted();
      unsubscribeError();
    };
  }, [api]);

  const loadSyncHistory = useCallback(async () => {
    try {
      const history = await api.tallySync.getSyncHistory();
      setSyncHistory(history);
    } catch (error) {
      console.error('Failed to load sync history:', error);
    }
  }, [api]);

  const startSync = useCallback(async (syncConfig) => {
    try {
      setIsLoading(true);
      const result = await api.tallySync.startSync(syncConfig);
      setSyncStatus(result);
      return result;
    } catch (error) {
      console.error('Failed to start sync:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);
  const cancelSync = useCallback(async (syncId) => {
    try {
      await api.tallySync.cancelSync(syncId);
      setSyncStatus(prev => prev ? { ...prev, status: 'cancelled' } : { status: 'cancelled' });
    } catch (error) {
      console.error('Failed to cancel sync:', error);
      throw error;
    }
  }, [api]);

  // Load initial history
  useEffect(() => {
    loadSyncHistory();
  }, [loadSyncHistory]);

  return {
    syncStatus,
    syncHistory,
    isLoading,
    startSync,
    cancelSync,
    testConnection: api.tallySync.testConnection,
    refreshHistory: loadSyncHistory
  };
};

export default useAPI;
