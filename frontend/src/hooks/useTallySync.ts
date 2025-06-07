/**
 * ================================================================
 * TallySync Pro - Tally ERP Integration Hook
 * ================================================================
 * 
 * A comprehensive React hook that manages all aspects of Tally ERP integration,
 * providing real-time connection monitoring, data synchronization capabilities,
 * and seamless state management for the TallySync Pro application.
 * 
 * CORE CAPABILITIES:
 * ┌─ Connection Management
 * │  ├─ Real-time Tally ERP connection monitoring
 * │  ├─ Backend service connectivity checks
 * │  ├─ Automatic reconnection attempts
 * │  └─ Connection health diagnostics
 * │
 * ├─ Data Synchronization
 * │  ├─ Real-time sync status tracking
 * │  ├─ Progress monitoring for data operations
 * │  ├─ Error handling and recovery
 * │  └─ Sync performance metrics
 * │
 * ├─ Configuration Management
 * │  ├─ Tally connection settings
 * │  ├─ User preferences persistence
 * │  ├─ API endpoint configuration
 * │  └─ Timeout and retry policies
 * │
 * └─ Notification System
 *    ├─ Success/error toast notifications
 *    ├─ Connection status alerts
 *    ├─ Sync progress updates
 *    └─ User action confirmations
 * 
 * @hook useTallySync
 * @version 2.0.0
 * @author Digidenone
 * @license MIT
 * @since 2025-01-01
 * @lastModified 2025-06-02
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// Declare the tallyAPI type that's exposed from electron preload
declare global {
  interface Window {
    tallyAPI: {
      testConnection: (config: any) => Promise<{ success: boolean; connected: boolean; error?: string }>;
      getConnectionStatus: () => Promise<{ success: boolean; connected: boolean }>;
      importVouchers: (data: any) => Promise<{ success: boolean; result?: any; error?: string }>;
      exportVouchers: (filters: any) => Promise<{ success: boolean; result?: any; error?: string }>;
      getMasters: (type: any) => Promise<{ success: boolean; result?: any; error?: string }>;
      saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
      getConfig: () => Promise<{ success: boolean; config: any; error?: string }>;
    };
    electronAPI?: {
      on: (channel: string, callback: (event: any) => void) => void;
      off: (channel: string, callback: (event: any) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

/**
 * Configuration interface for useTallySync hook options
 * 
 * @interface UseTallySyncOptions
 * @property {function} onSuccess - Callback for successful operations
 * @property {function} onError - Callback for error handling
 * @property {boolean} showToasts - Control automatic toast notifications
 */

interface UseTallySyncOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  showToasts?: boolean; // Control whether to show toast notifications
}

interface TallyConfig {
  server: string;
  port: number;
  company: string;
  username: string;
  password: string;
  tallyVersion?: string;
  dataPath?: string;
  financialYear?: string;
}

interface TallyVoucherData {
  type: string;
  date: string;
  voucherNumber: string;
  reference: string;
  ledgerName: string;
  amount: number;
  narration?: string;
  [key: string]: any;
}

export const useTallySync = (options?: UseTallySyncOptions) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [syncDetails, setSyncDetails] = useState<any>(null);
  
  // Performance metrics
  const [lastSyncDuration, setLastSyncDuration] = useState<number | null>(null);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  
  // Advanced connection state
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [tallyVersion, setTallyVersion] = useState<string>('');
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tallyConfig, setTallyConfig] = useState<TallyConfig>({
    server: '',
    port: 9000,    
    company: '',
    username: '',
    password: '',
    tallyVersion: 'Tally ERP 9',
    dataPath: '',
    financialYear: '',
  });

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await window.tallyAPI.getConfig();
      if (result.success) {
        setTallyConfig(result.config);
        // Test connection with loaded config
        await testConnection();
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const testConnection = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await window.tallyAPI.testConnection(tallyConfig);
      setIsConnected(result.connected);
      setLastChecked(new Date());
      
      if (result.success && result.connected) {
        options?.onSuccess?.('Connected to Tally successfully');
        if (!isConnected) {
          toast.success('Connected to Tally successfully');
        }
      } else {
        const error = result.error || 'Failed to connect to Tally';
        setConnectionError(error);
        options?.onError?.(error);
        if (options?.showToasts !== false) {
          toast.error(`Failed to connect to Tally: ${error}`);
        }
      }
      
      return result.connected;
    } catch (error) {
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error.message : 'Error connecting to Tally';
      setConnectionError(errorMessage);
      options?.onError?.(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [tallyConfig, options]);

  const saveConfig = async (newConfig: TallyConfig) => {
    try {
      const result = await window.tallyAPI.saveConfig(newConfig);
      if (result.success) {
        setTallyConfig(newConfig);
        toast.success('Configuration saved successfully');
        // Test connection with new config
        await testConnection();
      } else {
        toast.error(`Failed to save configuration: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    }
  };

  const analyzeExcelData = (data: TallyVoucherData[]): {
    totalVouchers: number;
    totalAmount: number;
    voucherTypes: string[];
    dateRange: { start: string; end: string };
  } => {
    return {
      totalVouchers: data.length,
      totalAmount: data.reduce((sum, item) => sum + (item.amount || 0), 0),
      voucherTypes: [...new Set(data.map(item => item.type))],
      dateRange: {
        start: data.reduce((min, item) => !min || item.date < min ? item.date : min, ''),
        end: data.reduce((max, item) => !max || item.date > max ? item.date : max, '')
      }
    };
  };

  const syncData = async (data: TallyVoucherData[], voucherType: string = '', ledgerName: string = '') => {
    if (!isConnected) {
      toast.error('Please connect to Tally first');
      return false;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus('');
    setSyncDetails(null);
    try {
      const result = await window.tallyAPI.importVouchers({
        data,
        voucherType,
        ledgerName,
        config: tallyConfig
      });

      if (result.success) {
        toast.success('Data synchronized successfully');
        options?.onSuccess?.('Data synchronized successfully');
        return true;
      } else {
        toast.error(`Sync failed: ${result.error}`);
        options?.onError?.(result.error || 'Sync failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error during sync';
      toast.error(errorMessage);
      options?.onError?.(errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  // Enhanced sync function with progress tracking
  const syncWithProgress = useCallback(async (data: TallyVoucherData[], syncOptions?: {
    onProgress?: (progress: number, status: string) => void;
    onComplete?: (result: any) => void;
    onError?: (error: string) => void;
  }) => {
    if (!data || data.length === 0) {
      toast.error('No data to sync');
      return false;
    }

    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus('Preparing sync...');
    const startTime = Date.now();

    try {
      // Validate connection first
      const connectionResult = await window.tallyAPI.testConnection(tallyConfig);
      if (!connectionResult.connected) {
        throw new Error(connectionResult.error || 'Not connected to Tally');
      }

      setSyncStatus('Syncing data...');
      setSyncProgress(10);

      const result = await window.tallyAPI.importVouchers(data);
      
      if (result.success) {
        const duration = Date.now() - startTime;
        setLastSyncDuration(duration);
        setSyncProgress(100);
        setSyncStatus('Sync completed');
        
        // Update sync history
        const syncRecord = {
          timestamp: new Date().toISOString(),
          duration,
          recordCount: data.length,
          success: true
        };
        setSyncHistory(prev => [syncRecord, ...prev.slice(0, 9)]);
        
        toast.success(`Successfully synced ${data.length} records in ${(duration / 1000).toFixed(1)}s`);
        options?.onSuccess?.(`Synced ${data.length} records successfully`);
        syncOptions?.onComplete?.(result);
        
        return true;
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error during sync';
      setSyncStatus('Sync failed');
      
      // Add to sync history
      const syncRecord = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        recordCount: data.length,
        success: false,
        error: errorMessage
      };
      setSyncHistory(prev => [syncRecord, ...prev.slice(0, 9)]);
      
      toast.error(errorMessage);
      syncOptions?.onError?.(errorMessage);
      return false;
    } finally {
      setIsSyncing(false);
      // Reset progress after 3 seconds
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStatus('');
      }, 3000);
    }
  }, [tallyConfig, options]);

  // Listen for sync progress events
  useEffect(() => {
    const handleSyncProgress = (event: any) => {
      setSyncProgress(event.progress || 0);
      setSyncStatus(event.status || '');
      setSyncDetails(event.details || null);
    };

    const handleSyncComplete = (event: any) => {
      setSyncProgress(100);
      setSyncStatus('Complete');
      setLastSyncDuration(event.duration || null);
      setSyncHistory(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 syncs
      
      // Reset after delay
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStatus('');
        setSyncDetails(null);
      }, 3000);
    };    // Listen for backend sync events (if available)
    if (window.electronAPI?.on) {
      window.electronAPI.on('syncProgress', handleSyncProgress);
      window.electronAPI.on('syncComplete', handleSyncComplete);
      
      return () => {
        if (window.electronAPI?.off) {
          window.electronAPI.off('syncProgress', handleSyncProgress);
          window.electronAPI.off('syncComplete', handleSyncComplete);
        }
      };
    }
  }, []);

  // Auto-check connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSyncing) {
        window.tallyAPI.getConnectionStatus()
          .then(result => {
            setIsConnected(result.connected);
            setLastChecked(new Date());
          })
          .catch(console.error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isSyncing]);
  return {
    // Connection state
    isConnecting,
    isConnected,
    connectionError,
    connectionLatency,
    lastChecked,
    
    // Sync state
    isSyncing,
    syncProgress,
    syncStatus,
    syncDetails,
    
    // Performance metrics
    lastSyncDuration,
    syncHistory,
    
    // Tally information
    tallyVersion,
    companyInfo,
    
    // Configuration
    tallyConfig,
    
    // Methods
    testConnection,
    saveConfig,
    analyzeExcelData,
    syncData,
    syncWithProgress,
    
    // Computed values
    connectionHealth: useMemo(() => {
      if (!isConnected) return 'disconnected';
      if (connectionLatency && connectionLatency > 5000) return 'poor';
      if (connectionLatency && connectionLatency > 2000) return 'fair';
      return 'good';
    }, [isConnected, connectionLatency]),
    
    syncPerformance: useMemo(() => {
      if (syncHistory.length === 0) return null;
      const successfulSyncs = syncHistory.filter(s => s.success);
      const avgDuration = successfulSyncs.reduce((acc, s) => acc + s.duration, 0) / successfulSyncs.length;
      const successRate = (successfulSyncs.length / syncHistory.length) * 100;
      
      return {
        avgDuration: Math.round(avgDuration),
        successRate: Math.round(successRate),
        totalSyncs: syncHistory.length,
        successfulSyncs: successfulSyncs.length
      };
    }, [syncHistory])
  };
};
