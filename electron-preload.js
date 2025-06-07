/**
 * ================================================================
 * TallySyncPro - Electron Preload Script
 * ================================================================
 * 
 * This preload script serves as a secure bridge between the Electron
 * main process and the renderer process (frontend). It exposes specific
 * APIs to the renderer while maintaining security isolation.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Security Features:
 * - Context isolation: APIs are exposed in isolated context
 * - No direct Node.js access in renderer
 * - Controlled IPC communication
 * - Typed API interfaces for better development experience
 * 
 * ================================================================
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose secure APIs to the renderer process
 * 
 * The contextBridge.exposeInMainWorld creates a secure API object
 * that can be accessed in the renderer as window.tallyAPI
 */
contextBridge.exposeInMainWorld('tallyAPI', {
  
  // ================================================================
  // TALLY CONNECTION MANAGEMENT
  // ================================================================
  
  /**
   * Test connection to Tally ERP server
   * @param {Object} config - Connection configuration
   * @param {string} config.host - Tally server hostname/IP
   * @param {number} config.port - Tally ODBC port (default: 9000)
   * @param {string} config.company - Company database name
   * @returns {Promise<{success: boolean, message: string}>}
   */
  testConnection: (config) => ipcRenderer.invoke('tally-test-connection', config),
  
  /**
   * Get current connection status
   * @returns {Promise<{connected: boolean, server: string, company: string}>}
   */
  getConnectionStatus: () => ipcRenderer.invoke('tally-get-status'),
  
  /**
   * Disconnect from Tally server
   * @returns {Promise<{success: boolean}>}
   */
  disconnect: () => ipcRenderer.invoke('tally-disconnect'),
  
  // ================================================================
  // TALLY DATA OPERATIONS
  // ================================================================
  
  /**
   * Import vouchers from Excel data to Tally
   * @param {Object} data - Voucher data to import
   * @param {Array} data.vouchers - Array of voucher objects
   * @param {string} data.voucherType - Type of vouchers (Sales, Purchase, etc.)
   * @param {Object} data.options - Import options
   * @returns {Promise<{success: boolean, imported: number, errors: Array}>}
   */
  importVouchers: (data) => ipcRenderer.invoke('tally-import-vouchers', data),
  
  /**
   * Export vouchers from Tally to Excel format
   * @param {Object} filters - Export filter criteria
   * @param {string} filters.fromDate - Start date (YYYY-MM-DD)
   * @param {string} filters.toDate - End date (YYYY-MM-DD)
   * @param {string} filters.voucherType - Voucher type filter
   * @returns {Promise<{success: boolean, data: Array, count: number}>}
   */
  exportVouchers: (filters) => ipcRenderer.invoke('tally-export-vouchers', filters),
  
  /**
   * Get master data from Tally (Ledgers, Groups, etc.)
   * @param {string} type - Master type ('ledger', 'group', 'item', 'unit')
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getMasters: (type) => ipcRenderer.invoke('tally-get-masters', type),
  
  /**
   * Create new master entries in Tally
   * @param {string} type - Master type
   * @param {Array} masters - Array of master objects to create
   * @returns {Promise<{success: boolean, created: number, errors: Array}>}
   */
  createMasters: (type, masters) => ipcRenderer.invoke('tally-create-masters', type, masters),
  
  // ================================================================
  // FILE OPERATIONS
  // ================================================================
  
  /**
   * Open file dialog to select Excel files
   * @param {Object} options - Dialog options
   * @param {Array} options.extensions - Allowed file extensions
   * @param {boolean} options.multiSelections - Allow multiple files
   * @returns {Promise<{success: boolean, files: Array}>}
   */
  selectFiles: (options) => ipcRenderer.invoke('file-select', options),
  
  /**
   * Save file dialog
   * @param {Object} options - Save dialog options
   * @param {string} options.defaultName - Default filename
   * @param {Array} options.extensions - Allowed extensions
   * @returns {Promise<{success: boolean, filePath: string}>}
   */
  saveFile: (options) => ipcRenderer.invoke('file-save', options),
  
  /**
   * Read Excel file and parse data
   * @param {string} filePath - Path to Excel file
   * @param {Object} options - Parsing options
   * @returns {Promise<{success: boolean, data: Array, sheets: Array}>}
   */
  readExcelFile: (filePath, options) => ipcRenderer.invoke('excel-read', filePath, options),
  
  /**
   * Write data to Excel file
   * @param {string} filePath - Output file path
   * @param {Array} data - Data to write
   * @param {Object} options - Write options
   * @returns {Promise<{success: boolean}>}
   */
  writeExcelFile: (filePath, data, options) => ipcRenderer.invoke('excel-write', filePath, data, options),
  
  // ================================================================
  // TEMPLATE MANAGEMENT
  // ================================================================
  
  /**
   * Get available Excel templates
   * @returns {Promise<{success: boolean, templates: Array}>}
   */
  getTemplates: () => ipcRenderer.invoke('template-list'),
  
  /**
   * Download template file
   * @param {string} templateName - Name of template to download
   * @param {string} savePath - Where to save the template
   * @returns {Promise<{success: boolean}>}
   */
  downloadTemplate: (templateName, savePath) => ipcRenderer.invoke('template-download', templateName, savePath),
  
  // ================================================================
  // CONFIGURATION MANAGEMENT
  // ================================================================
  
  /**
   * Save application configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<{success: boolean}>}
   */
  saveConfig: (config) => ipcRenderer.invoke('config-save', config),
  
  /**
   * Get application configuration
   * @returns {Promise<{success: boolean, config: Object}>}
   */
  getConfig: () => ipcRenderer.invoke('config-get'),
  
  /**
   * Reset configuration to defaults
   * @returns {Promise<{success: boolean}>}
   */
  resetConfig: () => ipcRenderer.invoke('config-reset'),
  
  // ================================================================
  // SYSTEM OPERATIONS
  // ================================================================
  
  /**
   * Get system information
   * @returns {Promise<{platform: string, version: string, arch: string}>}
   */
  getSystemInfo: () => ipcRenderer.invoke('system-info'),
  
  /**
   * Open external URL in default browser
   * @param {string} url - URL to open
   * @returns {Promise<void>}
   */
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  /**
   * Show notification
   * @param {Object} notification - Notification options
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {string} notification.icon - Icon path (optional)
   * @returns {Promise<void>}
   */
  showNotification: (notification) => ipcRenderer.invoke('show-notification', notification),
  
  // ================================================================
  // EVENT LISTENERS
  // ================================================================
  
  /**
   * Listen for connection status changes
   * @param {Function} callback - Callback function
   */
  onConnectionStatusChange: (callback) => {
    ipcRenderer.on('connection-status-changed', (event, status) => callback(status));
  },
  
  /**
   * Listen for import progress updates
   * @param {Function} callback - Progress callback
   */
  onImportProgress: (callback) => {
    ipcRenderer.on('import-progress', (event, progress) => callback(progress));
  },
  
  /**
   * Listen for application updates
   * @param {Function} callback - Update callback
   */
  onAppUpdate: (callback) => {
    ipcRenderer.on('app-update-available', (event, updateInfo) => callback(updateInfo));
  },
  
  /**
   * Remove event listeners
   * @param {string} eventName - Event name to remove
   */
  removeListener: (eventName) => {
    ipcRenderer.removeAllListeners(eventName);
  }
});

/**
 * Expose version information
 */
contextBridge.exposeInMainWorld('appInfo', {
  version: process.env.npm_package_version || '2.0.0',
  name: 'TallySyncPro',
  author: 'Digidenone',
  platform: process.platform,
  arch: process.arch,
  electron: process.versions.electron,
  node: process.versions.node
});

/**
 * Development mode helpers
 * Only available in development environment
 */
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devTools', {
    openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
    reloadApp: () => ipcRenderer.invoke('reload-app'),
    clearCache: () => ipcRenderer.invoke('clear-cache')
  });
}
