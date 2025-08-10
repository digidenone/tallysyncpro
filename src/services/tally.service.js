/**
 * ================================================================
 * TallySyncPro - Tally ERP Service
 * ================================================================
 * 
 * Comprehensive Tally ERP integration service that handles
 * ODBC connections, data synchronization, and XML processing
 * for seamless Excel to Tally data transfer.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Features:
 * - Enhanced ODBC connection management
 * - Advanced voucher CRUD operations
 * - Master data synchronization with XML
 * - Comprehensive data validation and transformation
 * - Robust error handling and retry logic
 * - Real-time performance monitoring
 * - Splash screen integration
 * - Local storage for sync history
 * 
 * ================================================================
 */

let odbc;
let odbcLoadError = null;
try {
  odbc = require('odbc');
} catch (err) {
  odbcLoadError = err;
  // Will rely on HTTP / Python fallbacks elsewhere; avoid crash
  require('electron-log').warn('[TallyService] ODBC module unavailable:', err.message);
}
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const log = require('electron-log');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../config/database.config');
const databaseService = require('./database.service');

/**
 * Tally ERP Service Class
 * Handles all Tally-specific operations and data management with enhanced features
 */
class TallyService extends EventEmitter {
  constructor() {
    super();
    
    // Enhanced service state
    this.isConnected = false;
    this.currentConnection = null;
    this.connectionProfile = null;
    this.tallyInfo = null;
    
    // Enhanced configuration with new features
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 5000,
      defaultPort: 9000,
      defaultHost: 'localhost',
      batchSize: 100,
      xmlValidation: true,
      backupEnabled: true
    };

    // XML templates for different data types
    this.xmlTemplates = {
      voucher: `<TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="{voucherType}" ACTION="Create">
          <DATE>{date}</DATE>
          <VOUCHERTYPENAME>{voucherType}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>{voucherNumber}</VOUCHERNUMBER>
          <REFERENCE>{reference}</REFERENCE>
          <NARRATION>{narration}</NARRATION>
          {ledgerEntries}
        </VOUCHER>
      </TALLYMESSAGE>`,
      
      ledger: `<TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="{name}" ACTION="Create">
          <NAME>{name}</NAME>
          <PARENT>{parent}</PARENT>
          <ALIAS>{alias}</ALIAS>
          <OPENINGBALANCE>{openingBalance}</OPENINGBALANCE>
        </LEDGER>
      </TALLYMESSAGE>`,
      
      stockItem: `<TALLYMESSAGE xmlns:UDF="TallyUDF">
        <STOCKITEM NAME="{name}" ACTION="Create">
          <NAME>{name}</NAME>
          <PARENT>{parent}</PARENT>
          <ALIAS>{alias}</ALIAS>
          <BASEUNITS>{units}</BASEUNITS>
          <OPENINGBALANCE>{openingBalance}</OPENINGBALANCE>
        </STOCKITEM>
      </TALLYMESSAGE>`
    };

    // Enhanced sync statistics
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      lastSync: null,
      avgSyncTime: 0,
      errorLog: []
    };
    
    // Operation counters
    this.stats = {
      queries: 0,
      imports: 0,
      exports: 0,
      errors: 0,
      lastOperation: null
    };
    
    // Tally-specific configurations
    this.tallyConfig = config.tally;
    
    // Enhanced configuration with new features
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 5000,
      defaultPort: 9000,
      defaultHost: 'localhost',
      batchSize: 100,
      xmlValidation: true,
      backupEnabled: true
    };

    // XML templates for different data types
    this.xmlTemplates = {
      voucher: `<TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="{voucherType}" ACTION="Create">
          <DATE>{date}</DATE>
          <VOUCHERTYPENAME>{voucherType}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>{voucherNumber}</VOUCHERNUMBER>
          <REFERENCE>{reference}</REFERENCE>
          <NARRATION>{narration}</NARRATION>
          {ledgerEntries}
        </VOUCHER>
      </TALLYMESSAGE>`,
      
      ledger: `<TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="{name}" ACTION="Create">
          <NAME>{name}</NAME>
          <PARENT>{parent}</PARENT>
          <ALIAS>{alias}</ALIAS>
          <OPENINGBALANCE>{openingBalance}</OPENINGBALANCE>
        </LEDGER>
      </TALLYMESSAGE>`,
      
      stockItem: `<TALLYMESSAGE xmlns:UDF="TallyUDF">
        <STOCKITEM NAME="{name}" ACTION="Create">
          <NAME>{name}</NAME>
          <PARENT>{parent}</PARENT>
          <ALIAS>{alias}</ALIAS>
          <BASEUNITS>{units}</BASEUNITS>
          <OPENINGBALANCE>{openingBalance}</OPENINGBALANCE>
        </STOCKITEM>
      </TALLYMESSAGE>`
    };

    // Enhanced sync statistics
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      lastSync: null,
      avgSyncTime: 0,
      errorLog: []
    };
    
    // Initialize service
    this.initialize();
  }
  
  /**
   * Initialize Tally service
   */
  async initialize() {
    try {
      // Listen to database service events
      databaseService.on('connected', (profile) => {
        if (this.isTallyProfile(profile)) {
          this.isConnected = true;
          this.connectionProfile = profile;
          this.emit('tallyConnected', profile);
        }
      });
      
      databaseService.on('disconnected', () => {
        this.isConnected = false;
        this.connectionProfile = null;
        this.emit('tallyDisconnected');
      });
      
      this.emit('initialized');
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
    
  // ================================================================
  // CONNECTION MANAGEMENT
  // ================================================================
  
  /**
   * Connect to Tally ERP server
   */
  async connect(profile) {
    try {
      const result = await databaseService.connectToTally(profile);
      
      if (result.success) {
        this.isConnected = true;
        this.connectionProfile = profile;
        
        // Verify Tally connection with a test query
        const testResult = await this.testTallyConnection();
        if (!testResult.success) {
          await this.disconnect();
          return { success: false, error: 'Failed to verify Tally connection' };
        }
        
        this.emit('connected', profile);
        return { success: true, message: 'Connected to Tally successfully' };
      }
      
      return result;
      
    } catch (error) {
      this.emit('connectionError', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Disconnect from Tally
   */
  async disconnect() {
    try {
      const result = await databaseService.disconnectFromTally();
      
      if (result.success) {
        this.isConnected = false;
        this.connectionProfile = null;
        this.emit('disconnected');
      }
      
      return result;
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Test Tally connection
   */
  async testTallyConnection() {
    try {
      if (!this.isConnected) {
        return { success: false, error: 'Not connected to Tally' };
      }
      
      // Try to query a basic Tally table to verify connection
      const result = await databaseService.executeTallyQuery(
        'SELECT TOP 1 * FROM Company'
      );
      
      return {
        success: result.success,
        connected: result.success,
        responseTime: result.responseTime,
        error: result.error
      };
      
    } catch (error) {
      return { success: false, connected: false, error: error.message };
    }
  }
  
  /**
   * Test connection to Tally ERP with enhanced validation
   */
  async testConnection(connectionData = {}) {
    try {
      const { host = 'localhost', port = 9000, database = '', username = '', password = '' } = connectionData;
      
      log.info(`TallyService: Testing connection to ${host}:${port}`);
      
      // Build connection string for Tally ODBC
      const connectionString = this.buildConnectionString({
        host, port, database, username, password
      });

      // Test connection with timeout
      if (!odbc) {
        return {
          success: false,
          error: `ODBC module not loaded${odbcLoadError ? ': ' + odbcLoadError.message : ''}`,
          suggestion: 'Rebuild native module: delete node_modules, set npm_config_arch=ia32, npm ci, then npm run rebuild:ia32'
        };
      }

      const connection = await Promise.race([
        odbc.connect(connectionString),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), this.config.timeout))
      ]);
      
      // Test with a simple query to verify access
      const testQuery = "SELECT TOP 1 NAME FROM COMPANY";
      const result = await connection.query(testQuery);
      
      await connection.close();

      const connectionInfo = {
        host, port, database, connected: true,
        companyName: result.length > 0 ? result[0].NAME : 'Unknown',
        testedAt: new Date().toISOString()
      };

      this.emit('connectionTested', connectionInfo);
      log.info('TallyService: Connection test successful');
      
      return { success: true, connectionInfo };

    } catch (error) {
      log.error('TallyService: Connection test failed:', error);
      this.emit('connectionTestFailed', error);
      
      return {
        success: false,
        error: error.message,
        suggestion: this.getConnectionErrorSuggestion(error.message)
      };
    }
  }
  
  /**
   * Advanced ODBC connection with retry logic and monitoring
   */
  async establishSecureConnection(profile) {
    try {
      const startTime = Date.now();
      let retryCount = 0;
      const maxRetries = this.config.retryAttempts;
      
      while (retryCount <= maxRetries) {
        try {
          this.emit('connectionAttempt', {
            attempt: retryCount + 1,
            maxRetries: maxRetries + 1,
            profile: profile.name || 'Default'
          });

          // Test basic connectivity first
          const pingResult = await this.pingTallyServer(profile.host, profile.port);
          if (!pingResult.success) {
            throw new Error(`Cannot reach Tally server: ${pingResult.error}`);
          }

          // Establish ODBC connection
          if (!odbc) {
            throw new Error(`ODBC module not loaded${odbcLoadError ? ': ' + odbcLoadError.message : ''}`);
          }
          const connectionString = this.buildAdvancedConnectionString(profile);
          const connection = await odbc.connect(connectionString);
          
          // Verify Tally-specific tables exist
          const verificationResult = await this.verifyTallyTables(connection);
          if (!verificationResult.success) {
            await connection.close();
            throw new Error(`Tally verification failed: ${verificationResult.error}`);
          }

          // Connection successful
          this.currentConnection = connection;
          this.isConnected = true;
          this.connectionProfile = profile;
          
          const connectionTime = Date.now() - startTime;
          this.emit('connected', {
            profile,
            connectionTime,
            attempt: retryCount + 1
          });

          log.info(`TallyService: Connected successfully in ${connectionTime}ms`);
          return { success: true, connectionTime };

        } catch (attemptError) {
          retryCount++;
          log.warn(`TallyService: Connection attempt ${retryCount} failed:`, attemptError.message);
          
          if (retryCount <= maxRetries) {
            this.emit('connectionRetry', {
              attempt: retryCount,
              error: attemptError.message,
              nextRetryIn: this.config.retryDelay
            });
            
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          } else {
            throw attemptError;
          }
        }
      }
    } catch (error) {
      this.emit('connectionFailed', {
        error: error.message,
        attempts: retryCount
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Ping Tally server to check basic connectivity
   */
  async pingTallyServer(host, port) {
    try {
      const net = require('net');
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        const startTime = Date.now();
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          const responseTime = Date.now() - startTime;
          socket.destroy();
          resolve({ success: true, responseTime });
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          resolve({ success: false, error: 'Connection timeout' });
        });
        
        socket.on('error', (error) => {
          socket.destroy();
          resolve({ success: false, error: error.message });
        });
        
        socket.connect(port, host);
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build advanced connection string with all options
   */
  buildAdvancedConnectionString(profile) {
    const {
      driver = 'Tally ODBC Driver',
      host = 'localhost',
      port = 9000,
      database = '',
      username = '',
      password = '',
      timeout = 30,
      autoCommit = true
    } = profile;

    return `Driver={${driver}};Server=${host};Port=${port};Database=${database};` +
           `Uid=${username};Pwd=${password};Timeout=${timeout};AutoCommit=${autoCommit ? 'Yes' : 'No'};`;
  }

  /**
   * Verify essential Tally tables exist
   */
  async verifyTallyTables(connection) {
    try {
      const essentialTables = ['COMPANY', 'LEDGER', 'VOUCHER', 'GROUP'];
      const missingTables = [];

      for (const table of essentialTables) {
        try {
          await connection.query(`SELECT TOP 1 * FROM ${table}`);
        } catch (error) {
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        return {
          success: false,
          error: `Missing essential tables: ${missingTables.join(', ')}`
        };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Import vouchers to Tally
   */
  async importVouchers(voucherData, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Tally');
      }
      
      const { vouchers, voucherType } = voucherData;
      const { batchSize = this.tallyConfig.query.batchSize } = options;
      
      // Validate voucher data
      const validation = this.validateVouchers(vouchers, voucherType);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
      
      // Process vouchers in batches
      const results = {
        total: vouchers.length,
        imported: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < vouchers.length; i += batchSize) {
        const batch = vouchers.slice(i, i + batchSize);
        const batchResult = await this.importVoucherBatch(batch, voucherType);
        
        results.imported += batchResult.imported;
        results.failed += batchResult.failed;
        results.errors.push(...batchResult.errors);
        
        // Emit progress
        this.emit('importProgress', {
          processed: Math.min(i + batchSize, vouchers.length),
          total: vouchers.length,
          progress: Math.min(i + batchSize, vouchers.length) / vouchers.length
        });
      }
      
      this.stats.imports++;
      this.stats.lastOperation = new Date();
      
      return { success: true, ...results };
      
    } catch (error) {
      this.stats.errors++;
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Export vouchers from Tally
   */
  async exportVouchers(filters = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Tally');
      }
      
      const query = this.buildExportQuery(filters);
      const result = await databaseService.executeTallyQuery(query);
      
      if (result.success) {
        this.stats.exports++;
        this.stats.lastOperation = new Date();
        
        return {
          success: true,
          data: result.data,
          count: result.rowCount,
          filters: filters
        };
      }
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get voucher by ID
   */
  async getVoucher(voucherId) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Tally');
      }
      
      const query = `
        SELECT * FROM Voucher 
        WHERE GUID = ? OR VoucherNumber = ?
      `;
      
      const result = await databaseService.executeTallyQuery(query, [voucherId, voucherId]);
      
      if (result.success && result.data.length > 0) {
        return { success: true, voucher: result.data[0] };
      }
      
      return { success: false, error: 'Voucher not found' };
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  // ================================================================
  // MASTER DATA OPERATIONS
  // ================================================================
  
  /**
   * Get master data from Tally
   */
  async getMasters(type, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Tally');
      }
      
      const tableConfig = this.tallyConfig.tables[type];
      if (!tableConfig) {
        throw new Error(`Unsupported master type: ${type}`);
      }
      
      const query = this.buildMasterQuery(type, options);
      const result = await databaseService.executeTallyQuery(query);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          count: result.rowCount,
          type: type
        };
      }
      
      return result;
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create master entries in Tally
   */
  async createMasters(type, masters, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Tally');
      }
      
      const { batchSize = this.tallyConfig.query.batchSize } = options;
      
      // Validate master data
      const validation = this.validateMasters(masters, type);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
      
      // Process masters in batches
      const results = {
        total: masters.length,
        created: 0,
        failed: 0,
        errors: []
      };
      
      for (let i = 0; i < masters.length; i += batchSize) {
        const batch = masters.slice(i, i + batchSize);
        const batchResult = await this.createMasterBatch(batch, type);
        
        results.created += batchResult.created;
        results.failed += batchResult.failed;
        results.errors.push(...batchResult.errors);
      }
      
      return { success: true, ...results };
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  // ================================================================
  // DATA VALIDATION
  // ================================================================
  
  /**
   * Validate voucher data
   */
  validateVouchers(vouchers, voucherType) {
    const errors = [];
    const validVouchers = [];
    
    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i];
      const voucherErrors = [];
      
      // Basic validation
      if (!voucher.Date) {
        voucherErrors.push('Date is required');
      }
      
      if (!voucher.VoucherTypeName) {
        voucherErrors.push('Voucher type is required');
      }
      
      if (!voucher.VoucherNumber) {
        voucherErrors.push('Voucher number is required');
      }
      
      // Voucher-specific validation
      if (voucherType === 'Sales' || voucherType === 'Purchase') {
        if (!voucher.PartyLedgerName) {
          voucherErrors.push('Party ledger is required');
        }
        
        if (!voucher.Amount || isNaN(voucher.Amount)) {
          voucherErrors.push('Valid amount is required');
        }
      }
      
      if (voucherErrors.length > 0) {
        errors.push({
          row: i + 1,
          voucher: voucher,
          errors: voucherErrors
        });
      } else {
        validVouchers.push(voucher);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      validVouchers: validVouchers
    };
  }
  
  /**
   * Validate master data
   */
  validateMasters(masters, type) {
    const errors = [];
    const validMasters = [];
    
    for (let i = 0; i < masters.length; i++) {
      const master = masters[i];
      const masterErrors = [];
      
      // Type-specific validation
      switch (type) {
        case 'ledgers':
          if (!master.LedgerName) {
            masterErrors.push('Ledger name is required');
          }
          if (!master.Parent) {
            masterErrors.push('Parent group is required');
          }
          break;
          
        case 'stockItems':
          if (!master.StockItemName) {
            masterErrors.push('Stock item name is required');
          }
          if (!master.BaseUnits) {
            masterErrors.push('Base unit is required');
          }
          break;
          
        default:
          masterErrors.push(`Unsupported master type: ${type}`);
      }
      
      if (masterErrors.length > 0) {
        errors.push({
          row: i + 1,
          master: master,
          errors: masterErrors
        });
      } else {
        validMasters.push(master);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      validMasters: validMasters
    };
  }
  
  // ================================================================
  // QUERY BUILDERS
  // ================================================================
  
  /**
   * Build export query based on filters
   */
  buildExportQuery(filters) {
    let query = 'SELECT * FROM Voucher WHERE 1=1';
    const params = [];
    
    if (filters.fromDate) {
      query += ' AND Date >= ?';
      params.push(filters.fromDate);
    }
    
    if (filters.toDate) {
      query += ' AND Date <= ?';
      params.push(filters.toDate);
    }
    
    if (filters.voucherType) {
      query += ' AND VoucherTypeName = ?';
      params.push(filters.voucherType);
    }
    
    if (filters.company) {
      query += ' AND CompanyName = ?';
      params.push(filters.company);
    }
    
    query += ' ORDER BY Date DESC, VoucherNumber';
    
    if (filters.limit) {
      query += ` TOP ${filters.limit}`;
    }
    
    return query;
  }
  
  /**
   * Build master query
   */
  buildMasterQuery(type, options) {
    const tableConfig = this.tallyConfig.tables[type];
    let query = `SELECT * FROM ${tableConfig.tableName} WHERE 1=1`;
    
    if (options.search) {
      query += ` AND ${tableConfig.nameColumn} LIKE '%${options.search}%'`;
    }
    
    if (options.parent) {
      query += ` AND Parent = '${options.parent}'`;
    }
    
    query += ` ORDER BY ${tableConfig.nameColumn}`;
    
    if (options.limit) {
      query += ` TOP ${options.limit}`;
    }
    
    return query;
  }
  
  // ================================================================
  // BATCH OPERATIONS
  // ================================================================
  
  /**
   * Import batch of vouchers
   */
  async importVoucherBatch(vouchers, voucherType) {
    const results = { imported: 0, failed: 0, errors: [] };
    
    for (const voucher of vouchers) {
      try {
        const query = this.buildVoucherInsertQuery(voucher, voucherType);
        const result = await databaseService.executeTallyQuery(query);
        
        if (result.success) {
          results.imported++;
        } else {
          results.failed++;
          results.errors.push({
            voucher: voucher,
            error: result.error
          });
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          voucher: voucher,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Create batch of masters
   */
  async createMasterBatch(masters, type) {
    const results = { created: 0, failed: 0, errors: [] };
    
    for (const master of masters) {
      try {
        const query = this.buildMasterInsertQuery(master, type);
        const result = await databaseService.executeTallyQuery(query);
        
        if (result.success) {
          results.created++;
        } else {
          results.failed++;
          results.errors.push({
            master: master,
            error: result.error
          });
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          master: master,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  // ================================================================
  // UTILITY FUNCTIONS
  // ================================================================
  
  /**
   * Check if profile is for Tally connection
   */
  isTallyProfile(profile) {
    return profile && profile.type === 'tally';
  }
  
  /**
   * Build voucher insert query
   */
  buildVoucherInsertQuery(voucher, voucherType) {
    // This would be implemented based on Tally's ODBC insert requirements
    // Implementation depends on specific Tally ODBC driver capabilities
    return `INSERT INTO Voucher (Date, VoucherTypeName, VoucherNumber, PartyLedgerName, Amount) 
            VALUES ('${voucher.Date}', '${voucherType}', '${voucher.VoucherNumber}', 
                    '${voucher.PartyLedgerName}', ${voucher.Amount})`;
  }
  
  /**
   * Build master insert query
   */
  buildMasterInsertQuery(master, type) {
    const tableConfig = this.tallyConfig.tables[type];
    // Implementation depends on specific master type and Tally ODBC capabilities
    return `INSERT INTO ${tableConfig.tableName} (${tableConfig.nameColumn}, Parent) 
            VALUES ('${master.name}', '${master.parent}')`;
  }
  
  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      connectionProfile: this.connectionProfile?.name || null,
      uptime: process.uptime()
    };
  }
  
  /**
   * Get supported voucher types
   */
  getSupportedVoucherTypes() {
    return this.tallyConfig.voucherTypes || [];
  }
  
  /**
   * Get supported master types
   */
  getSupportedMasterTypes() {
    return this.tallyConfig.masterTypes || [];
  }
  
  /**
   * Enhanced sync data method with comprehensive error handling
   */
  async syncData(syncData) {
    try {
      if (!this.isConnected && !syncData.mockMode) {
        throw new Error('Not connected to Tally ERP');
      }

      const syncId = uuidv4();
      const startTime = Date.now();
      
      log.info(`TallyService: Starting sync operation ${syncId}`);
      
      this.emit('syncStarted', {
        syncId,
        dataType: syncData.type,
        recordCount: syncData.records?.length || 0
      });

      const results = {
        syncId,
        success: false,
        totalRecords: syncData.records?.length || 0,
        processedRecords: 0,
        failedRecords: 0,
        errors: [],
        startTime,
        endTime: null,
        duration: 0,
        batchResults: []
      };

      // Process data based on type with batch processing
      switch (syncData.type) {
        case 'vouchers':
          await this.syncVouchers(syncData.records, results, syncData.options);
          break;
        case 'ledgers':
          await this.syncLedgers(syncData.records, results, syncData.options);
          break;
        case 'items':
          await this.syncItems(syncData.records, results, syncData.options);
          break;
        case 'companies':
          await this.syncCompanies(syncData.records, results, syncData.options);
          break;
        default:
          throw new Error(`Unsupported sync type: ${syncData.type}`);
      }

      results.endTime = Date.now();
      results.duration = results.endTime - results.startTime;
      results.success = results.failedRecords === 0;

      // Update comprehensive sync statistics
      this.updateSyncStatistics(results);

      this.emit('syncCompleted', results);
      log.info(`TallyService: Sync operation ${syncId} completed - ${results.processedRecords}/${results.totalRecords} records`);
      
      return results;

    } catch (error) {
      log.error('TallyService: Sync operation failed:', error);
      this.emit('syncFailed', error);
      throw error;
    }
  }

  /**
   * Sync vouchers with batch processing
   */
  async syncVouchers(vouchers, results, options = {}) {
    const batchSize = options.batchSize || this.config.batchSize;
    const batches = this.createBatches(vouchers, batchSize);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchResult = {
        batchIndex: batchIndex + 1,
        totalBatches: batches.length,
        processed: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < batch.length; i++) {
        try {
          const voucher = batch[i];
          const recordIndex = (batchIndex * batchSize) + i;
          
          // Emit detailed progress
          this.emit('syncProgress', {
            current: recordIndex + 1,
            total: vouchers.length,
            percentage: Math.round(((recordIndex + 1) / vouchers.length) * 100),
            currentRecord: voucher,
            batch: batchIndex + 1,
            totalBatches: batches.length
          });

          // Validate voucher data
          this.validateVoucherData(voucher);

          // Generate and process XML
          const voucherXML = this.generateVoucherXML(voucher);
          await this.importVoucherToTally(voucherXML, options);
          
          results.processedRecords++;
          batchResult.processed++;
          
        } catch (error) {
          results.failedRecords++;
          batchResult.failed++;
          
          const errorInfo = {
            record: (batchIndex * batchSize) + i + 1,
            error: error.message,
            data: batch[i],
            batch: batchIndex + 1
          };
          
          results.errors.push(errorInfo);
          batchResult.errors.push(errorInfo);
          
          log.error(`TallyService: Failed to sync voucher ${errorInfo.record}:`, error);
        }
      }

      results.batchResults.push(batchResult);
      
      // Emit batch completion
      this.emit('batchCompleted', batchResult);
      
      // Optional delay between batches
      if (options.batchDelay && batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, options.batchDelay));
      }
    }

    return results;
  }

  /**
   * Enhanced voucher XML generation with validation
   */
  generateVoucherXML(voucher) {
    // Validate required fields
    if (!voucher.voucherType) throw new Error('Voucher type is required');
    if (!voucher.date) throw new Error('Voucher date is required');

    const ledgerEntries = voucher.ledgerEntries?.map(entry => `
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${this.escapeXML(entry.ledgerName)}</LEDGERNAME>
        <AMOUNT>${entry.amount || 0}</AMOUNT>
        <ISPARTYLEDGER>${entry.isPartyLedger ? 'Yes' : 'No'}</ISPARTYLEDGER>
        ${entry.billAllocations ? this.generateBillAllocations(entry.billAllocations) : ''}
      </ALLLEDGERENTRIES.LIST>
    `).join('') || '';

    return `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER VCHTYPE="${this.escapeXML(voucher.voucherType)}" ACTION="Create">
          <DATE>${moment(voucher.date).format('YYYYMMDD')}</DATE>
          <VOUCHERTYPENAME>${this.escapeXML(voucher.voucherType)}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${this.escapeXML(voucher.voucherNumber || '')}</VOUCHERNUMBER>
          <REFERENCE>${this.escapeXML(voucher.reference || '')}</REFERENCE>
          <NARRATION>${this.escapeXML(voucher.narration || '')}</NARRATION>
          ${ledgerEntries}
        </VOUCHER>
      </TALLYMESSAGE>
    `.trim();
  }

  /**
   * Create batches from array
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Validate voucher data
   */
  async validateVoucherData(vouchers) {
    try {
      const errors = [];
      const warnings = [];

      for (let i = 0; i < vouchers.length; i++) {
        const voucher = vouchers[i];
        const voucherIndex = i + 1;

        // Required fields validation
        if (!voucher.voucherType) {
          errors.push(`Row ${voucherIndex}: Voucher type is required`);
        }
        if (!voucher.date) {
          errors.push(`Row ${voucherIndex}: Date is required`);
        }
        if (!voucher.amount || isNaN(parseFloat(voucher.amount))) {
          errors.push(`Row ${voucherIndex}: Valid amount is required`);
        }

        // Date format validation
        if (voucher.date && !moment(voucher.date, 'DD-MM-YYYY', true).isValid()) {
          errors.push(`Row ${voucherIndex}: Invalid date format. Use DD-MM-YYYY`);
        }

        // Ledger validation
        if (!voucher.ledgerName) {
          errors.push(`Row ${voucherIndex}: Ledger name is required`);
        }

        // Amount validation
        const amount = parseFloat(voucher.amount);
        if (amount === 0) {
          warnings.push(`Row ${voucherIndex}: Zero amount voucher`);
        }
        if (amount < 0 && !['Payment', 'Receipt', 'Contra'].includes(voucher.voucherType)) {
          warnings.push(`Row ${voucherIndex}: Negative amount for ${voucher.voucherType}`);
        }

        // Business logic validations
        if (voucher.voucherType === 'Sales' && amount < 0) {
          errors.push(`Row ${voucherIndex}: Sales voucher cannot have negative amount`);
        }
        if (voucher.voucherType === 'Purchase' && amount < 0) {
          errors.push(`Row ${voucherIndex}: Purchase voucher cannot have negative amount`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        totalRecords: vouchers.length,
        validRecords: vouchers.length - errors.length
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        totalRecords: vouchers.length,
        validRecords: 0
      };
    }
  }

  /**
   * Get detailed Tally system information
   */
  async getTallySystemInfo() {
    try {
      if (!this.isConnected) {
        return { success: false, error: 'Not connected to Tally' };
      }

      const queries = [
        { name: 'companies', query: 'SELECT COUNT(*) as count FROM COMPANY' },
        { name: 'ledgers', query: 'SELECT COUNT(*) as count FROM LEDGER' },
        { name: 'vouchers', query: 'SELECT COUNT(*) as count FROM VOUCHER' },
        { name: 'groups', query: 'SELECT COUNT(*) as count FROM "GROUP"' }
      ];

      const systemInfo = {};
      
      for (const { name, query } of queries) {
        try {
          const result = await databaseService.executeTallyQuery(query);
          systemInfo[name] = result.success ? result.data[0]?.count || 0 : 0;
        } catch (error) {
          systemInfo[name] = 0;
        }
      }

      return {
        success: true,
        systemInfo,
        connectionProfile: this.connectionProfile,
        isConnected: this.isConnected,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Start real-time monitoring of Tally connection
   */
  startConnectionMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      if (this.isConnected && this.currentConnection) {
        try {
          const startTime = Date.now();
          
          // Quick health check query
          await this.currentConnection.query('SELECT 1 as test');
          
          const responseTime = Date.now() - startTime;
          
          this.emit('connectionHealth', {
            status: 'healthy',
            responseTime,
            timestamp: new Date().toISOString()
          });
          
          // Update connection latency
          this.connectionLatency = responseTime;
          
        } catch (error) {
          log.error('TallyService: Connection health check failed:', error);
          
          this.emit('connectionHealth', {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          // Attempt reconnection
          await this.handleConnectionLoss();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Handle connection loss and attempt recovery
   */
  async handleConnectionLoss() {
    try {
      log.info('TallyService: Attempting to recover connection...');
      
      this.isConnected = false;
      
      this.emit('connectionLost', {
        timestamp: new Date().toISOString(),
        attempting_recovery: true
      });
      
      // Attempt to reconnect with stored profile
      if (this.connectionProfile) {
        const reconnectResult = await this.establishSecureConnection(this.connectionProfile);
        
        if (reconnectResult.success) {
          this.emit('connectionRecovered', {
            timestamp: new Date().toISOString(),
            recovery_time: reconnectResult.connectionTime
          });
        }
      }
    } catch (error) {
      log.error('TallyService: Connection recovery failed:', error);
      
      this.emit('connectionRecoveryFailed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getPerformanceMetrics() {
    return {
      connection: {
        isConnected: this.isConnected,
        latency: this.connectionLatency,
        profile: this.connectionProfile?.name || 'Unknown',
        uptime: this.connectionProfile ? Date.now() - this.connectionStartTime : 0
      },
      sync: {
        ...this.syncProgress,
        avgSyncTime: this.syncProgress.avgSyncTime,
        successRate: this.syncProgress.totalRecords > 0 
          ? (this.syncProgress.successfulRecords / this.syncProgress.totalRecords) * 100 
          : 0
      },
      operations: {
        ...this.stats,
        errorRate: this.stats.queries > 0 
          ? (this.stats.errors / this.stats.queries) * 100 
          : 0
      }
    };
  }

  /**
   * Export performance data for analysis
   */
  async exportPerformanceData() {
    try {
      const metrics = this.getPerformanceMetrics();
      const exportData = {
        timestamp: new Date().toISOString(),
        metrics,
        systemInfo: await this.getTallySystemInfo(),
        errorLog: this.syncProgress.errorLog.slice(-50) // Last 50 errors
      };

      return {
        success: true,
        data: exportData,
        filename: `tally-performance-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new TallyService();
