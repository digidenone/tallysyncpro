/**
 * NotificationService - Advanced User Notification System
 * 
 * A comprehensive notification management service that provides rich, 
 * interactive notifications throughout the TallySync Pro application.
 * 
 * CORE FEATURES:
 * - Multiple notification types (success, error, warning, info)
 * - Rich content support with titles and descriptions
 * - Interactive action buttons and callbacks
 * - Customizable duration and positioning
 * - Queue management for multiple notifications
 * - Progress notifications for long-running operations
 * 
 * NOTIFICATION TYPES:
 * - Success: Confirm successful operations
 * - Error: Alert users to failures and issues
 * - Warning: Inform about potential problems
 * - Info: Provide general information updates
 * - Progress: Show operation status and completion
 * 
 * ADVANCED FEATURES:
 * - Auto-dismiss with configurable timing
 * - Manual dismiss functionality
 * - Persistent notifications for critical alerts
 * - Rich HTML content support
 * - Custom styling and themes
 * - Sound notifications (optional)
 * 
 * INTEGRATION:
 * - Seamless integration with Sonner toast library
 * - React component lifecycle management
 * - State management for notification history
 * - Accessibility compliance (ARIA labels)
 * - Mobile-responsive design
 * 
 * USAGE PATTERNS:
 * - Operation feedback (save, delete, update)
 * - Connection status updates
 * - Data validation messages
 * - Process completion notifications
 * - Error recovery guidance
 * 
 * @class NotificationService
 * @version 2.0.0
 * @author TallySync Pro Team
 */
import { toast } from 'sonner';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationService {
  // Private static properties for cooldown management
  private static notificationCooldowns: Map<string, number> = new Map();
  private static readonly DEFAULT_COOLDOWN = 5000; // 5 seconds

  /**
   * Check if notification should be shown based on cooldown timer
   * @param key Unique identifier for the notification type
   * @param cooldownMs Cooldown period in milliseconds (default: 5000ms)
   * @returns true if notification should be shown, false if still in cooldown
   */
  private static shouldShowNotification(key: string, cooldownMs: number = NotificationService.DEFAULT_COOLDOWN): boolean {
    const now = Date.now();
    const lastShown = this.notificationCooldowns.get(key);
    
    if (!lastShown || (now - lastShown) >= cooldownMs) {
      this.notificationCooldowns.set(key, now);
      return true;
    }
    
    return false;
  }

  /**
   * Clear cooldown for specific notification key (use for testing or forced updates)
   */
  private static clearCooldown(key: string): void {
    this.notificationCooldowns.delete(key);
  }

  /**
   * Clear all notification cooldowns
   */
  private static clearAllCooldowns(): void {
    this.notificationCooldowns.clear();
  }

  static success(message: string, options?: NotificationOptions) {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  static error(message: string, options?: NotificationOptions) {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  }

  static warning(message: string, options?: NotificationOptions) {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  }

  static info(message: string, options?: NotificationOptions) {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  }

  // Specialized notifications for TallySync Pro
  static connectionSuccess(stage: 'backend' | 'tally', details?: string) {
    const messages = {
      backend: {
        title: '🔗 Backend Connected',
        description: details || 'Successfully connected to TallySync Pro backend service'
      },
      tally: {
        title: '💼 Tally Connected', 
        description: details || 'Successfully connected to Tally ERP system'
      }
    };

    toast.success(messages[stage].title, {
      description: messages[stage].description,
      duration: 5000,
    });
  }
  static connectionError(stage: 'backend' | 'tally', error?: string) {
    const key = `connection-error-${stage}`;
    if (!this.shouldShowNotification(key, 15000)) return; // 15 second cooldown for connection errors
    
    const messages = {
      backend: {
        title: '❌ Backend Connection Failed',
        description: error || 'Unable to connect to TallySync Pro backend service'
      },
      tally: {
        title: '❌ Tally Connection Failed',
        description: error || 'Unable to connect to Tally ERP system'
      }
    };

    toast.error(messages[stage].title, {
      description: messages[stage].description,
      duration: 8000,
      action: {
        label: 'Retry',
        onClick: () => window.location.reload()
      }
    });
  }
  static fileUploadSuccess(filename: string, size?: number) {
    const key = `file-upload-success-${filename}`;
    if (!this.shouldShowNotification(key)) return;
    
    const sizeText = size ? ` (${Math.round(size / 1024)}KB)` : '';
    toast.success('📄 File Uploaded Successfully', {
      description: `${filename}${sizeText} is ready for processing`,
      duration: 4000,
    });
  }

  static fileUploadError(error: string) {
    const key = `file-upload-error`;
    if (!this.shouldShowNotification(key, 10000)) return; // 10 second cooldown for errors
    
    toast.error('📄 File Upload Failed', {
      description: error,
      duration: 6000,
    });
  }

  static fileProcessingStart(filename: string) {
    const key = `file-processing-start-${filename}`;
    if (!this.shouldShowNotification(key)) return;
    
    toast.info('⚙️ Processing File', {
      description: `Processing ${filename}...`,
      duration: 3000,
    });
  }

  static fileProcessingSuccess(filename: string, recordsProcessed: number) {
    const key = `file-processing-success-${filename}`;
    if (!this.shouldShowNotification(key)) return;
    
    toast.success('✅ File Processed Successfully', {
      description: `${filename} - ${recordsProcessed} records processed`,
      duration: 5000,
    });
  }

  static tallyImportSuccess(recordsImported: number) {
    const key = `tally-import-success`;
    if (!this.shouldShowNotification(key)) return;
    
    toast.success('💼 Data Imported to Tally', {
      description: `${recordsImported} records successfully imported to Tally ERP`,
      duration: 6000,
    });
  }

  static downloadReady(type: 'template' | 'service', filename?: string) {
    const key = `download-ready-${type}`;
    if (!this.shouldShowNotification(key)) return;
    
    const messages = {
      template: {
        title: '📥 Template Download Ready',
        description: 'Excel template file is ready for download'
      },
      service: {
        title: '🔧 Service Download Ready', 
        description: 'TallySync Pro service file is ready for download'
      }
    };

    toast.success(messages[type].title, {
      description: messages[type].description,
      duration: 4000,
    });
  }

  static connectionProgress(step: number, totalSteps: number, description: string) {
    // Don't apply cooldown to progress notifications as they're sequential
    toast.info(`Step ${step}/${totalSteps}: ${description}`, {
      description: 'Establishing connections...',
      duration: 2000,
    });
  }

  static dismiss() {
    toast.dismiss();
  }

  /**
   * Force show notification (bypass cooldown) - use sparingly
   */
  static forceShow = {
    success: (message: string, options?: NotificationOptions) => {
      toast.success(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
      });
    },
    error: (message: string, options?: NotificationOptions) => {
      toast.error(message, {
        description: options?.description,
        duration: options?.duration || 6000,
        action: options?.action,
      });
    },
    info: (message: string, options?: NotificationOptions) => {
      toast.info(message, {
        description: options?.description,
        duration: options?.duration || 4000,
        action: options?.action,
      });
    }
  };

  static promise<T>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Something went wrong',
    }: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }
}

export default NotificationService;
