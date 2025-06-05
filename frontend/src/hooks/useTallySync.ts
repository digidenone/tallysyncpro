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
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tallyConfig, setTallyConfig] = useState<TallyConfig>({
    server: '',
    port: 9000,
    company: '',
    username: '',
    password: '',
    tallyVersion: 'Latest',
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
    isConnecting,
    isConnected,
    isSyncing,
    lastChecked,
    connectionError,
    tallyConfig,
    testConnection,
    saveConfig,
    analyzeExcelData,
    syncData
  };
};
