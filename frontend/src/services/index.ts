/**
 * Services Index
 * 
 * Central export point for all application services.
 * Provides a clean API for importing services throughout the application.
 * 
 * @fileoverview Service exports and initialization
 * @version 1.0.0
 * @author TallySync Pro Team
 * @license MIT
 */

// Core Services
export { default as TallyService } from './TallyService';
export { default as TallySyncService } from './TallySyncService';
export { default as NotificationService } from './NotificationService';

// Service Types (re-export from main types)
export type {
  TallyConfig,
  TallyVoucherData,
  ConnectionStatus,
  NotificationOptions,
  ApiResponse
} from '../types';

// Service Configuration
export const SERVICES_CONFIG = {
  tally: {
    retryAttempts: 3,
    timeout: 10000,
    autoReconnect: true
  },
  notification: {
    maxToasts: 3,
    defaultDuration: 4000,
    position: 'bottom-right' as const
  },
  sync: {
    batchSize: 100,
    maxConcurrent: 5,
    progressUpdateInterval: 1000
  }
} as const;

// Service initialization helper
export const initializeServices = () => {
  console.log('🔧 Initializing TallySync Pro Services...');
  
  // Initialize any global service configurations here
  // This can be called from the main App component
  
  console.log('✅ Services initialized successfully');
};

export default {
  TallyService,
  TallySyncService,
  NotificationService,
  SERVICES_CONFIG,
  initializeServices
};
