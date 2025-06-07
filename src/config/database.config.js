/**
 * ================================================================
 * TallySyncPro - Database Configuration
 * ================================================================
 * 
 * Database and ODBC connection configuration for Tally ERP integration.
 * This module handles all database-related settings, connection pooling,
 * and query optimization parameters.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Features:
 * - ODBC connection management
 * - Connection pooling
 * - Query optimization
 * - Error handling and retry logic
 * - Performance monitoring
 * 
 * ================================================================
 */

const path = require('path');
const os = require('os');

/**
 * Database Configuration Object
 */
const dbConfig = {
  
  // ================================================================
  // TALLY ERP ODBC CONFIGURATION
  // ================================================================
  tally: {
    // Default connection parameters
    connection: {
      host: process.env.TALLY_HOST || 'localhost',
      port: parseInt(process.env.TALLY_PORT) || 9000,
      timeout: 30000, // 30 seconds
      loginTimeout: 15000, // 15 seconds
      
      // ODBC Driver settings
      driver: 'Tally ODBC Driver',
      dsn: 'TallyDatabase',
      
      // Connection string template
      connectionStringTemplate: 'Driver={Tally ODBC Driver};Server=${host};Port=${port};Database=${database};Uid=${username};Pwd=${password};',
      
      // SSL/TLS settings (if supported by Tally ODBC)
      ssl: {
        enabled: false,
        rejectUnauthorized: true,
        ca: null,
        cert: null,
        key: null
      }
    },
    
    // Connection pooling configuration
    pool: {
      enabled: true,
      min: 1,
      max: 5,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      propagateCreateError: false
    },
    
    // Query execution settings
    query: {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 100,
      maxConcurrent: 3,
      
      // Query optimization
      optimization: {
        useParameterizedQueries: true,
        enableQueryPlan: false,
        cacheQueries: true,
        maxCacheSize: 100
      }
    },
    
    // Specific table configurations
    tables: {
      // Voucher tables
      vouchers: {
        tableName: 'Voucher',
        primaryKey: 'GUID',
        dateColumn: 'Date',
        batchSize: 50,
        indexes: ['Date', 'VoucherTypeName', 'VoucherNumber']
      },
      
      // Ledger master
      ledgers: {
        tableName: 'Ledger',
        primaryKey: 'GUID',
        nameColumn: 'LedgerName',
        batchSize: 100,
        indexes: ['LedgerName', 'Parent']
      },
      
      // Stock items
      stockItems: {
        tableName: 'StockItem',
        primaryKey: 'GUID',
        nameColumn: 'StockItemName',
        batchSize: 100,
        indexes: ['StockItemName', 'Parent']
      },
      
      // Units of measure
      units: {
        tableName: 'Unit',
        primaryKey: 'GUID',
        nameColumn: 'UnitName',
        batchSize: 200
      },
      
      // Companies
      companies: {
        tableName: 'Company',
        primaryKey: 'GUID',
        nameColumn: 'CompanyName',
        batchSize: 50
      }
    }
  },
  
  // ================================================================
  // LOCAL SQLITE CONFIGURATION (for caching and configuration)
  // ================================================================
  local: {
    // SQLite database for local storage
    sqlite: {
      enabled: true,
      path: path.join(os.homedir(), 'TallySyncPro', 'data', 'tallysync.db'),
      
      // SQLite-specific options
      options: {
        busyTimeout: 5000,
        synchronous: 'NORMAL',
        journalMode: 'WAL',
        foreignKeys: true,
        autoVacuum: 'INCREMENTAL'
      },
      
      // Connection pool for SQLite
      pool: {
        max: 10,
        min: 1,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 600000
      }
    },
    
    // Tables structure for local database
    tables: {
      // Configuration storage
      config: {
        tableName: 'app_config',
        createSql: `
          CREATE TABLE IF NOT EXISTS app_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      
      // Connection profiles
      connections: {
        tableName: 'connection_profiles',
        createSql: `
          CREATE TABLE IF NOT EXISTS connection_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            database_name TEXT,
            username TEXT,
            password TEXT, -- Encrypted
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      
      // Sync history
      syncHistory: {
        tableName: 'sync_history',
        createSql: `
          CREATE TABLE IF NOT EXISTS sync_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation_type TEXT NOT NULL,
            table_name TEXT NOT NULL,
            records_processed INTEGER DEFAULT 0,
            records_success INTEGER DEFAULT 0,
            records_failed INTEGER DEFAULT 0,
            start_time DATETIME NOT NULL,
            end_time DATETIME,
            status TEXT DEFAULT 'running',
            error_message TEXT,
            details TEXT, -- JSON
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      
      // Error logs
      errorLogs: {
        tableName: 'error_logs',
        createSql: `
          CREATE TABLE IF NOT EXISTS error_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT NOT NULL,
            message TEXT NOT NULL,
            stack_trace TEXT,
            context TEXT, -- JSON
            source TEXT,
            user_id TEXT,
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      
      // Cache for frequently accessed data
      dataCache: {
        tableName: 'data_cache',
        createSql: `
          CREATE TABLE IF NOT EXISTS data_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cache_key TEXT UNIQUE NOT NULL,
            cache_value TEXT NOT NULL,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    }
  },
  
  // ================================================================
  // BACKUP CONFIGURATION
  // ================================================================
  backup: {
    enabled: true,
    
    // Backup schedule
    schedule: {
      automatic: true,
      frequency: 'daily', // 'hourly', 'daily', 'weekly'
      time: '02:00', // 2:00 AM
      timezone: 'local'
    },
    
    // Backup storage
    storage: {
      local: {
        enabled: true,
        path: path.join(os.homedir(), 'TallySyncPro', 'backups'),
        retention: {
          days: 30,
          maxFiles: 50
        },
        compression: true
      },
      
      cloud: {
        enabled: false,
        provider: null, // 'aws', 'azure', 'gcp'
        bucket: null,
        credentials: null
      }
    },
    
    // What to backup
    include: {
      configuration: true,
      syncHistory: true,
      errorLogs: true,
      userPreferences: true,
      connectionProfiles: false // Exclude for security
    }
  },
  
  // ================================================================
  // PERFORMANCE MONITORING
  // ================================================================
  monitoring: {
    enabled: true,
    
    // Query performance tracking
    queryPerformance: {
      enabled: true,
      logSlowQueries: true,
      slowQueryThreshold: 5000, // 5 seconds
      sampleRate: 0.1 // Sample 10% of queries
    },
    
    // Connection monitoring
    connectionMonitoring: {
      enabled: true,
      healthCheckInterval: 60000, // 1 minute
      alertThreshold: {
        connectionFailures: 5,
        responseTime: 10000 // 10 seconds
      }
    },
    
    // Metrics collection
    metrics: {
      enabled: true,
      retention: '7d',
      aggregation: {
        queryCount: true,
        queryDuration: true,
        connectionCount: true,
        errorRate: true
      }
    }
  },
  
  // ================================================================
  // SECURITY CONFIGURATION
  // ================================================================
  security: {
    // Password encryption
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'pbkdf2',
      iterations: 100000,
      saltLength: 32
    },
    
    // Connection security
    connection: {
      requireEncryption: false,
      validateCertificates: true,
      allowSelfSigned: false
    },
    
    // Access control
    access: {
      maxFailedAttempts: 5,
      lockoutDuration: 300000, // 5 minutes
      sessionTimeout: 3600000 // 1 hour
    }
  }
};

/**
 * Environment-specific overrides
 */
const environmentOverrides = {
  development: {
    tally: {
      connection: {
        timeout: 10000 // Shorter timeout for development
      },
      query: {
        timeout: 10000,
        maxRetries: 1
      }
    },
    monitoring: {
      queryPerformance: {
        logSlowQueries: true,
        slowQueryThreshold: 1000 // 1 second in dev
      }
    }
  },
  
  production: {
    tally: {
      pool: {
        max: 10 // More connections in production
      }
    },
    monitoring: {
      queryPerformance: {
        sampleRate: 0.01 // Sample 1% in production
      }
    }
  }
};

/**
 * Apply environment-specific configuration
 */
function applyEnvironmentConfig(baseConfig, env) {
  const envConfig = environmentOverrides[env];
  if (!envConfig) return baseConfig;
  
  return mergeDeep(baseConfig, envConfig);
}

/**
 * Deep merge utility function
 */
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// Apply environment configuration
const finalConfig = applyEnvironmentConfig(dbConfig, process.env.NODE_ENV || 'development');

/**
 * Configuration validation
 */
function validateDatabaseConfig(config) {
  const errors = [];
  
  // Validate Tally configuration
  if (!config.tally.connection.host) {
    errors.push('Tally host is required');
  }
  
  if (!config.tally.connection.port || config.tally.connection.port < 1 || config.tally.connection.port > 65535) {
    errors.push('Valid Tally port is required (1-65535)');
  }
  
  // Validate pool configuration
  if (config.tally.pool.min < 0 || config.tally.pool.max < config.tally.pool.min) {
    errors.push('Invalid connection pool configuration');
  }
  
  // Validate SQLite path
  if (config.local.sqlite.enabled && !config.local.sqlite.path) {
    errors.push('SQLite database path is required when SQLite is enabled');
  }
  
  if (errors.length > 0) {
    throw new Error(`Database configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

/**
 * Build connection string from configuration
 */
function buildConnectionString(profile) {
  const template = finalConfig.tally.connection.connectionStringTemplate;
  
  return template
    .replace('${host}', profile.host || finalConfig.tally.connection.host)
    .replace('${port}', profile.port || finalConfig.tally.connection.port)
    .replace('${database}', profile.database || '')
    .replace('${username}', profile.username || '')
    .replace('${password}', profile.password || '');
}

/**
 * Get table configuration by name
 */
function getTableConfig(tableName) {
  return finalConfig.tally.tables[tableName] || null;
}

// Validate configuration on load
validateDatabaseConfig(finalConfig);

/**
 * Export configuration and utility functions
 */
module.exports = {
  config: finalConfig,
  validateDatabaseConfig,
  buildConnectionString,
  getTableConfig,
  
  // Utility functions
  getTallyConfig: () => finalConfig.tally,
  getLocalConfig: () => finalConfig.local,
  getBackupConfig: () => finalConfig.backup,
  getMonitoringConfig: () => finalConfig.monitoring,
  getSecurityConfig: () => finalConfig.security,
  
  // Environment detection
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production'
};
