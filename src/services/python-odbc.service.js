/**
 * ================================================================
 * TallySyncPro - Python ODBC Service
 * ================================================================
 * 
 * Service for interfacing with Python pyodbc as a fallback
 * when node-odbc is not available or fails.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class PythonODBCService {
  constructor() {
    this.pythonPath = null;
    this.scriptPath = path.join(__dirname, '..', 'python', 'pyodbc_connector.py');
    this.isAvailable = false;
    this.pyodbcAvailable = false;
  }

  /**
   * Initialize the Python ODBC service
   */
  async initialize() {
    try {
      // Check if Python script exists
      await fs.access(this.scriptPath);
      
      // Find Python executable
      this.pythonPath = await this.findPythonExecutable();
      
      if (this.pythonPath) {
        // Test if the script runs and check pyodbc availability
        const result = await this.executeCommand('check');
        this.isAvailable = result.success;
        this.pyodbcAvailable = result.pyodbc_available;
        
        console.log(`Python ODBC Service initialized: ${this.isAvailable ? 'Available' : 'Not Available'}`);
        console.log(`PyODBC module: ${this.pyodbcAvailable ? 'Available' : 'Not Available'}`);
        
        return { success: true, available: this.isAvailable, pyodbcAvailable: this.pyodbcAvailable };
      }
      
      return { success: false, error: 'Python executable not found' };
      
    } catch (error) {
      console.warn('Python ODBC Service initialization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find Python executable (try python3, python, py in that order)
   */
  async findPythonExecutable() {
    const candidates = ['python3', 'python', 'py'];
    
    for (const candidate of candidates) {
      try {
        const result = await this.spawnProcess(candidate, ['--version']);
        if (result.success && result.stdout.includes('Python')) {
          console.log(`Found Python: ${candidate} - ${result.stdout.trim()}`);
          return candidate;
        }
      } catch (error) {
        // Continue to next candidate
      }
    }
    
    return null;
  }

  /**
   * Test connection using pyodbc
   */
  async testConnection(config) {
    if (!this.isAvailable) {
      return { 
        success: false, 
        error: 'Python ODBC service not available',
        method: 'pyodbc',
        connected: false 
      };
    }

    try {
      // Build connection string
      const connectionString = this.buildConnectionString(config);
      
      // Execute test command
      const result = await this.executeCommand('test', connectionString);
      
      return {
        ...result,
        host: config?.host || 'localhost',
        port: config?.port || 9000
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        method: 'pyodbc',
        connected: false 
      };
    }
  }

  /**
   * Execute SQL query using pyodbc
   */
  async executeQuery(config, sqlQuery) {
    if (!this.isAvailable) {
      return { 
        success: false, 
        error: 'Python ODBC service not available',
        method: 'pyodbc'
      };
    }

    try {
      const connectionString = this.buildConnectionString(config);
      const result = await this.executeCommand('query', connectionString, sqlQuery);
      
      return result;
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        method: 'pyodbc'
      };
    }
  }

  /**
   * List available ODBC drivers
   */
  async listDrivers() {
    if (!this.isAvailable) {
      return { 
        success: false, 
        error: 'Python ODBC service not available',
        method: 'pyodbc'
      };
    }

    try {
      const result = await this.executeCommand('drivers');
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        method: 'pyodbc'
      };
    }
  }

  /**
   * Build connection string for Tally ODBC
   */
  buildConnectionString(config) {
    // Prefer DSN if explicitly provided
    if (config && config.dsn) {
      return `DSN=${config.dsn};`;
    }

    // Build driver-based connection string
    const driver = (config && config.driver) || 'Tally ODBC Driver';
    const host = (config && config.host) || 'localhost';
    const port = (config && config.port) || 9000;

    // Minimal connection string for Tally ERP 9
    return `Driver={${driver}};Server=${host};Port=${port};`;
  }

  /**
   * Execute Python command
   */
  async executeCommand(command, ...args) {
    if (!this.pythonPath) {
      throw new Error('Python executable not found');
    }

    const commandArgs = [this.scriptPath, command, ...args];
    const result = await this.spawnProcess(this.pythonPath, commandArgs);
    
    if (!result.success) {
      throw new Error(`Python script failed: ${result.stderr || result.error}`);
    }

    try {
      return JSON.parse(result.stdout);
    } catch (parseError) {
      throw new Error(`Failed to parse Python script output: ${parseError.message}\nOutput: ${result.stdout}`);
    }
  }

  /**
   * Spawn a child process and return the result
   */
  spawnProcess(command, args, options = {}) {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        timeout: 30000, // 30 second timeout
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          error: code !== 0 ? `Process exited with code ${code}` : null
        });
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          code: -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          error: error.message
        });
      });

      // Handle timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
          resolve({
            success: false,
            code: -1,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            error: 'Process timeout'
          });
        }
      }, 31000); // Slightly longer than the process timeout
    });
  }

  /**
   * Check if service is available
   */
  isServiceAvailable() {
    return this.isAvailable && this.pyodbcAvailable;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable,
      pyodbcAvailable: this.pyodbcAvailable,
      pythonPath: this.pythonPath,
      scriptPath: this.scriptPath
    };
  }

  /**
   * Install pyodbc instructions
   */
  getInstallInstructions() {
    const instructions = [
      "To enable PyODBC fallback, install pyodbc:",
      "",
      "Method 1 - Using pip:",
      "  pip install pyodbc",
      "",
      "Method 2 - Using conda:",
      "  conda install pyodbc",
      "",
      "For Windows with 32-bit setup:",
      "  pip install pyodbc --force-reinstall --no-deps",
      "",
      "Note: You may need the Microsoft ODBC Driver for SQL Server:",
      "  Download from: https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server"
    ];
    
    return instructions.join('\n');
  }
}

// Export singleton instance
module.exports = new PythonODBCService();