/**
 * Type Definitions for TallySyncPro
 * 
 * Comprehensive TypeScript type definitions for the entire application.
 * Organized by domain and feature for better maintainability.
 * 
 * @fileoverview Global type definitions
 * @version 1.0.0
 * @author TallySync Pro Team
 * @license MIT
 */

// ===== CORE APPLICATION TYPES =====

/**
 * Application status states
 */
export type AppStatus = 'initializing' | 'ready' | 'error' | 'maintenance';

/**
 * Environment types
 */
export type Environment = 'development' | 'production' | 'staging' | 'test';

/**
 * Theme types
 */
export type ThemeMode = 'light' | 'dark' | 'system';

// ===== CONNECTION & API TYPES =====

/**
 * Connection status for various services
 */
export interface ConnectionStatus {
  backend: 'connected' | 'disconnected' | 'cloud';
  frontend: string;
  mode: 'local' | 'cloud';
  version: string;
  uptime?: number;
  lastChecked?: string;
  features: {
    cloudSync: boolean;
    templateGeneration: boolean;
    dataProcessing: boolean;
    downloadExecutable: boolean;
  };
}

/**
 * API Response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * Connection step status for UI
 */
export interface ConnectionStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
}

// ===== TALLY SPECIFIC TYPES =====

/**
 * Tally connection configuration
 */
export interface TallyConfig {
  server: string;
  port: number;
  company: string;
  username: string;
  password: string;
  tallyVersion?: string;
  dataPath?: string;
  financialYear?: string;
}

/**
 * Tally company information
 */
export interface TallyCompany {
  name: string;
  guid: string;
  financialYear: string;
  version: string;
  dataPath: string;
}

/**
 * Tally voucher data structure
 */
export interface TallyVoucherData {
  voucherNumber: string;
  voucherType: string;
  date: string;
  reference?: string;
  narration?: string;
  amount: number;
  ledgerName: string;
  debitAmount?: number;
  creditAmount?: number;
  [key: string]: any; // Allow additional dynamic fields
}

/**
 * Tally ledger information
 */
export interface TallyLedger {
  name: string;
  group: string;
  alias?: string;
  openingBalance?: number;
  closingBalance?: number;
}

/**
 * Tally master data types
 */
export type TallyMasterType = 'ledgers' | 'groups' | 'vouchers' | 'items' | 'categories';

// ===== FILE & DATA PROCESSING TYPES =====

/**
 * File upload state
 */
export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
  file: File | null;
}

/**
 * Excel file processing result
 */
export interface ExcelProcessingResult {
  totalRows: number;
  validRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  data: TallyVoucherData[];
}

/**
 * Download state for files
 */
export interface DownloadState {
  isDownloading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

// ===== UI COMPONENT TYPES =====

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/**
 * Notification options
 */
export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
}

/**
 * Loading state
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// ===== DASHBOARD & ANALYTICS TYPES =====

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  recordsSynced: number;
  filesProcessed: number;
  activeSessions: number;
  avgSyncSpeed: string;
  lastSyncTime?: string;
  uptime?: string;
}

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error' | 'warning' | 'info';
  details?: string;
  user?: string;
}

/**
 * Real-time update data
 */
export interface RealTimeUpdate {
  type: 'connection' | 'sync' | 'error' | 'notification';
  timestamp: string;
  payload: any;
}

// ===== SETTINGS & PREFERENCES TYPES =====

/**
 * User preferences
 */
export interface UserPreferences {
  theme: ThemeMode;
  language: string;
  notifications: {
    enabled: boolean;
    types: ToastType[];
  };
  autoSync: boolean;
  defaultCompany?: string;
}

/**
 * Application settings
 */
export interface AppSettings {
  tallyConfig: TallyConfig;
  userPreferences: UserPreferences;
  features: Record<string, boolean>;
}

// ===== HOOK TYPES =====

/**
 * TallySync hook options
 */
export interface UseTallySyncOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  showToasts?: boolean;
  autoConnect?: boolean;
}

/**
 * TallySync hook return type
 */
export interface UseTallySyncReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  tallyConfig: TallyConfig;
  lastChecked: Date | null;
  connectionError: string | null;
  testConnection: () => Promise<boolean>;
  syncData: (data: TallyVoucherData[]) => Promise<boolean>;
  disconnect: () => Promise<void>;
}

// ===== UTILITY TYPES =====

/**
 * Optional utility type for making specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required utility type for making specific properties required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial utility type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ===== ERROR TYPES =====

/**
 * Application error types
 */
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Validation error for forms
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ===== EXPORT ALL TYPES =====
export type {
  // Re-export commonly used types for easy importing
  TallyVoucherData as VoucherData,
  TallyConfig as ConnectionConfig,
  ApiResponse as Response,
  NotificationOptions as ToastOptions
};

// Default export with all types
export default {
  // This allows importing the entire types module if needed
};
