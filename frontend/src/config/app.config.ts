/**
 * Application Configuration
 * 
 * Central configuration file for TallySync Pro application.
 * Contains all environment variables, API endpoints, and global settings.
 * 
 * @fileoverview Application configuration and constants
 * @version 1.0.0
 * @author TallySync Pro Team
 * @license MIT
 */

// Application Information
export const APP_CONFIG = {
  name: 'TallySync Pro',
  version: '1.0.0',
  description: 'Excel to Tally ERP Data Synchronization Platform',
  author: 'Digidenone',
  license: 'MIT'
} as const;

// API Configuration
export const API_CONFIG = {
  // Development URLs
  local: {
    frontend: 'http://localhost:8080',
    backend: 'http://localhost:9000',
    api: 'http://localhost:9000/api'
  },
  
  // Bundled application URLs (standalone .exe)
  bundled: {
    frontend: 'http://localhost:3001',
    backend: 'http://localhost:3001',
    api: 'http://localhost:3001/api'
  },
  
  // Production URLs
  production: {
    frontend: 'https://tallysync.vercel.app',
    backend: 'https://tallysync.vercel.app',
    api: 'https://tallysync.vercel.app/api'
  },
  
  // API Endpoints
  endpoints: {
    health: '/health',
    status: '/status',
    tally: {
      connect: '/tally/connect',
      disconnect: '/tally/disconnect',
      status: '/tally/status',
      test: '/tally/test-connection',
      dashboard: '/tally/dashboard'
    },
    templates: '/templates',
    data: '/data',
    relay: '/relay'
  },
  
  // Request timeouts (in milliseconds)
  timeouts: {
    default: 5000,
    connection: 10000,
    upload: 30000,
    download: 60000
  }
} as const;

// Tally Configuration
export const TALLY_CONFIG = {
  defaultPort: 9000,
  supportedVersions: ['Latest', 'Tally Prime', 'Tally ERP 9'],
  odbcConfig: {
    driver: 'TallyODBC64',
    defaultDatabase: 'TallyDB'
  }
} as const;

// UI Configuration
export const UI_CONFIG = {
  theme: {
    default: 'system', // 'light' | 'dark' | 'system'
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    }
  },
  
  toast: {
    duration: {
      default: 4000,
      success: 4000,
      error: 6000,
      warning: 5000,
      loading: 0 // No auto-dismiss for loading
    },
    position: 'bottom-right' as const,
    maxToasts: 3
  },
  
  animations: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out'
  }
} as const;

// Feature Flags
export const FEATURES = {
  // Core features
  excelImport: true,
  tallyExport: true,
  realTimeSync: true,
  
  // Advanced features
  bulkOperations: true,
  dataValidation: true,
  auditLog: true,
  
  // Experimental features (can be toggled for testing)
  advancedReports: false,
  multiCompany: false,
  apiIntegration: true
} as const;

// File Upload Configuration
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv' // .csv
  ],
  allowedExtensions: ['.xlsx', '.xls', '.csv']
} as const;

// Environment Detection
export const getEnvironment = () => {
  if (typeof window === 'undefined') return 'server';
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Check if running as bundled application (standalone .exe)
  if (hostname === 'localhost' && port === '3001') {
    return 'bundled';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('vercel.app') || hostname.includes('tallysync.')) {
    return 'production';
  }
  
  return 'development';
};

// Get current API configuration based on environment
export const getCurrentApiConfig = () => {
  const env = getEnvironment();
  
  switch (env) {
    case 'bundled':
      return API_CONFIG.bundled;
    case 'production':
      return API_CONFIG.production;
    default:
      return API_CONFIG.local;
  }
};

// Utility function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  const config = getCurrentApiConfig();
  let url = `${config.api}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

export default {
  APP_CONFIG,
  API_CONFIG,
  TALLY_CONFIG,
  UI_CONFIG,
  FEATURES,
  UPLOAD_CONFIG,
  getEnvironment,
  getCurrentApiConfig,
  buildApiUrl
};
