/**
 * ================================================================
 * TallySyncPro - Database Service
 * ================================================================
 * 
 * Core database service for managing ODBC connections to Tally ERP
 * and local SQLite database operations. This service provides a
 * unified interface for all database operations.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Features:
 * - Connection pooling and management
 * - Query execution with retry logic
 * - Transaction support
 * - Performance monitoring
 * - Error handling and logging
 * 
 * ================================================================
 */

const EventEmitter = require('events');
let sqlite3;
try {
  sqlite3 = require('sqlite3').verbose();
} catch (error) {
  console.log('SQLite3 not available, using ODBC only');
  sqlite3 = null;
}
const odbc = require('odbc');
const path = require('path');
const fs = require('fs').promises;
const fsExtra = require('fs-extra'); // Add fs-extra for directory creation
const { config: dbConfig } = require('../config/database.config');

/**
 * Database Service Class
 * Manages both Tally ODBC and local SQLite connections
 */
class DatabaseService extends EventEmitter {
  constructor() {
    super();
      // Initialization tracking
    this.isInitialized = false;
    this.sqliteInitialized = false;
    this.directoryEnsured = false;
    
    // Connection pools
    this.tallyPool = null;
    this.sqliteDb = null;
    
    // Connection state
    this.isConnected = false;
    this.connectionProfiles = new Map();
    this.activeProfile = null;
    
    // Performance monitoring
    this.queryStats = {
      totalQueries: 0,
      slowQueries: 0,
      errorCount: 0,
      averageResponseTime: 0
    };
    
    // Initialize service
    this.initialize();
  }
    /**
   * Initialize database service
   */
  async initialize() {
    try {
      // Initialize local SQLite database only if available
      if (sqlite3) {
        await this.initializeSQLite();
      } else {
        console.log('SQLite3 not available, skipping local database initialization');
      }
      
      // Load connection profiles
      await this.loadConnectionProfiles();
      
      // Setup monitoring
      this.setupMonitoring();
      
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
    // ================================================================
  // SQLITE OPERATIONS
  // ================================================================
    /**
   * Initialize local SQLite database
   */
  async initializeSQLite() {
    if (!sqlite3) {
      console.log('SQLite3 not available, skipping initialization');
      return;
    }
    
    if (this.sqliteInitialized) {
      return;
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        const dbPath = dbConfig.local.sqlite.path;
        const dbDir = path.dirname(dbPath);
        
        // Ensure database directory exists
        await fsExtra.ensureDir(dbDir);
        // Database directory created or exists
        if (!this.directoryEnsured) {
          console.log(`Database directory ensured: ${dbDir}`);          this.directoryEnsured = true;
        }
        
        // Only create SQLite database if sqlite3 is available
        if (!sqlite3) {
          reject(new Error('SQLite3 not available'));
          return;
        }
        
        this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            reject(new Error(`Failed to initialize SQLite: ${err.message}`));
            return;
          }
            // Create tables
          this.createLocalTables()
            .then(() => {
              if (!this.sqliteInitialized) {
                console.log('SQLite database initialized successfully');
                this.sqliteInitialized = true;
              }
              resolve();
            })
            .catch(reject);
        });
      } catch (error) {
        reject(new Error(`Failed to prepare SQLite database: ${error.message}`));
      }
    });
  }
  
  /**
   * Create local database tables
   */
  async createLocalTables() {
    const tables = dbConfig.local.tables;
    
    for (const [tableName, tableConfig] of Object.entries(tables)) {
      await this.executeSQLite(tableConfig.createSql);
    }
  }
  
  /**
   * Execute SQLite query
   */
  async executeSQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  // ================================================================
  // TALLY CONNECTION MANAGEMENT
  // ================================================================
  
  /**
   * Connect to Tally ERP database
   */
  async connectToTally(profile) {
    try {
      const connectionString = this.buildConnectionString(profile);
      
      // Test connection first
      const testConnection = await odbc.connect(connectionString);
      await testConnection.close();
      
      // Create connection pool
      this.tallyPool = await odbc.pool({
        connectionString,
        initialSize: dbConfig.tally.pool.min,
        maxSize: dbConfig.tally.pool.max,
        shrink: true,
        reuseConnections: true
      });
      
      this.isConnected = true;
      this.activeProfile = profile;
      
      this.emit('connected', profile);
      
      return { success: true, message: 'Connected successfully' };
      
    } catch (error) {
      this.isConnected = false;
      this.emit('connectionError', error);
      
      return { 
        success: false, 
        error: error.message,
        code: error.code 
      };
    }
  }
  
  /**
   * Disconnect from Tally
   */
  async disconnectFromTally() {
    try {
      if (this.tallyPool) {
        await this.tallyPool.close();
        this.tallyPool = null;
      }
      
      this.isConnected = false;
      this.activeProfile = null;
      
      this.emit('disconnected');
      
      return { success: true };
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Test Tally connection
   */
  async testTallyConnection(profile) {
    try {
      const connectionString = this.buildConnectionString(profile);
      const connection = await odbc.connect(connectionString);
      
      // Try to execute a simple query
      const result = await connection.query('SELECT 1 as test');
      await connection.close();
      
      return { 
        success: true, 
        connected: true,
        responseTime: Date.now() - Date.now() // This would be properly measured
      };
      
    } catch (error) {
      return { 
        success: false, 
        connected: false,
        error: error.message,
        code: error.code
      };
    }
  }
  
  // ================================================================
  // QUERY EXECUTION
  // ================================================================
  
  /**
   * Execute Tally query with retry logic
   */
  async executeTallyQuery(sql, params = [], options = {}) {
    const startTime = Date.now();
    let attempt = 0;
    const maxRetries = options.maxRetries || dbConfig.tally.query.maxRetries;
    const retryDelay = options.retryDelay || dbConfig.tally.query.retryDelay;
    
    while (attempt <= maxRetries) {
      try {
        if (!this.isConnected || !this.tallyPool) {
          throw new Error('Not connected to Tally database');
        }
        
        const connection = await this.tallyPool.connect();
        
        try {
          const result = await connection.query(sql, params);
          const responseTime = Date.now() - startTime;
          
          // Update statistics
          this.updateQueryStats(responseTime, false);
          
          return {
            success: true,
            data: result,
            responseTime,
            rowCount: result.length
          };
          
        } finally {
          await connection.close();
        }
        
      } catch (error) {
        attempt++;
        
        if (attempt > maxRetries) {
          const responseTime = Date.now() - startTime;
          this.updateQueryStats(responseTime, true);
          
          this.emit('queryError', {
            sql,
            params,
            error: error.message,
            attempts: attempt,
            responseTime
          });
          
          return {
            success: false,
            error: error.message,
            code: error.code,
            attempts: attempt,
            responseTime
          };
        }
        
        // Wait before retry
        await this.delay(retryDelay * attempt);
      }
    }
  }
  
  /**
   * Execute batch queries
   */
  async executeBatch(queries, options = {}) {
    const batchSize = options.batchSize || dbConfig.tally.query.batchSize;
    const results = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map(query => 
        this.executeTallyQuery(query.sql, query.params, query.options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Emit progress
      this.emit('batchProgress', {
        completed: Math.min(i + batchSize, queries.length),
        total: queries.length,
        progress: Math.min(i + batchSize, queries.length) / queries.length
      });
    }
    
    return results;
  }
  
  // ================================================================
  // CONNECTION PROFILE MANAGEMENT
  // ================================================================
  
  /**
   * Save connection profile
   */
  async saveConnectionProfile(profile) {
    try {
      const encryptedPassword = await this.encryptPassword(profile.password);
      
      const sql = `
        INSERT OR REPLACE INTO connection_profiles 
        (name, host, port, database_name, username, password, is_default, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      await this.executeSQLite(sql, [
        profile.name,
        profile.host,
        profile.port,
        profile.databaseName || '',
        profile.username || '',
        encryptedPassword,
        profile.isDefault || false
      ]);
      
      // Update in-memory cache
      this.connectionProfiles.set(profile.name, profile);
      
      return { success: true };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Load connection profiles from local database
   */
  async loadConnectionProfiles() {
    try {
      const sql = 'SELECT * FROM connection_profiles WHERE is_active = 1';
      const rows = await this.executeSQLite(sql);
      
      for (const row of rows) {
        const profile = {
          id: row.id,
          name: row.name,
          host: row.host,
          port: row.port,
          databaseName: row.database_name,
          username: row.username,
          password: await this.decryptPassword(row.password),
          isDefault: Boolean(row.is_default),
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        
        this.connectionProfiles.set(row.name, profile);
      }
      
      return { success: true, profiles: Array.from(this.connectionProfiles.values()) };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get connection profile by name
   */
  getConnectionProfile(name) {
    return this.connectionProfiles.get(name) || null;
  }
  
  /**
   * Get all connection profiles
   */
  getAllConnectionProfiles() {
    return Array.from(this.connectionProfiles.values());
  }
  
  // ================================================================
  // UTILITY FUNCTIONS
  // ================================================================
  
  /**
   * Build connection string from profile
   */
  buildConnectionString(profile) {
    // Prefer DSN if explicitly provided (recommended for Tally ODBC)
    if (profile && profile.dsn) {
      return `DSN=${profile.dsn};`;
    }

    // Build minimal driver-based connection string for Tally ERP 9
    const driver = (profile && profile.driver) || dbConfig.tally.connection.driver || 'Tally ODBC Driver';
    const host = (profile && profile.host) || dbConfig.tally.connection.host || 'localhost';
    const port = (profile && profile.port) || dbConfig.tally.connection.port || 9000;

    // Tally ERP 9 ODBC typically doesn't require Database/Uid/Pwd
    const minimal = `Driver={${driver}};Server=${host};Port=${port};`;

    // If template exists and user intentionally provided credentials, keep compatibility
    const template = dbConfig.tally.connection.connectionStringTemplate;
    if (profile && (profile.databaseName || profile.username || profile.password)) {
      return template
        .replace('${host}', host)
        .replace('${port}', port)
        .replace('${database}', profile.databaseName || '')
        .replace('${username}', profile.username || '')
        .replace('${password}', profile.password || '');
    }

    return minimal;
  }
  
  /**
   * Update query statistics
   */
  updateQueryStats(responseTime, isError) {
    this.queryStats.totalQueries++;
    
    if (isError) {
      this.queryStats.errorCount++;
    }
    
    if (responseTime > dbConfig.monitoring.queryPerformance.slowQueryThreshold) {
      this.queryStats.slowQueries++;
    }
    
    // Update average response time
    this.queryStats.averageResponseTime = 
      (this.queryStats.averageResponseTime * (this.queryStats.totalQueries - 1) + responseTime) / 
      this.queryStats.totalQueries;
  }
  
  /**
   * Setup monitoring
   */
  setupMonitoring() {
    if (!dbConfig.monitoring.enabled) return;
    
    // Health check interval
    setInterval(async () => {
      if (this.isConnected) {
        const healthCheck = await this.testTallyConnection(this.activeProfile);
        
        if (!healthCheck.success) {
          this.emit('healthCheckFailed', healthCheck.error);
        }
      }
    }, dbConfig.monitoring.connectionMonitoring.healthCheckInterval);
  }
  
  /**
   * Encrypt password
   */
  async encryptPassword(password) {
    // Implementation would use crypto module
    // For now, return base64 encoded (not secure for production)
    return Buffer.from(password).toString('base64');
  }
  
  /**
   * Decrypt password
   */
  async decryptPassword(encryptedPassword) {
    // Implementation would use crypto module
    // For now, return base64 decoded (not secure for production)
    return Buffer.from(encryptedPassword, 'base64').toString();
  }
  
  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.queryStats,
      isConnected: this.isConnected,
      activeProfile: this.activeProfile?.name || null,
      connectionProfiles: this.connectionProfiles.size,
      uptime: process.uptime()
    };
  }
  
  /**
   * Close all connections and cleanup
   */
  async cleanup() {
    try {
      await this.disconnectFromTally();
      
      if (this.sqliteDb) {
        this.sqliteDb.close();
        this.sqliteDb = null;
      }
      
      this.emit('cleanup');
      
    } catch (error) {
      this.emit('error', error);
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();
