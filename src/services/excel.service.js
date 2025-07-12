/**
 * ================================================================
 * TallySyncPro - Excel Service
 * ================================================================
 * 
 * Service for handling Excel file operations including reading,
 * writing, template management, and data transformation for
 * Tally ERP integration.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * Features:
 * - Excel file reading and writing
 * - Template management
 * - Data validation and transformation
 * - Batch processing
 * - Progress tracking
 * 
 * ================================================================
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');
const moment = require('moment');

/**
 * Excel Service Class
 * Handles all Excel-related operations
 */
class ExcelService extends EventEmitter {
  constructor() {
    super();
    
    // Service configuration
    this.config = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      defaultSheetName: 'Sheet1',
      maxRows: 100000,
      maxColumns: 100
    };
    
    // Template cache
    this.templateCache = new Map();
    
    // Processing statistics
    this.stats = {
      filesProcessed: 0,
      rowsProcessed: 0,
      errorsEncountered: 0,
      lastProcessed: null
    };
  }
  
  // ================================================================
  // FILE READING OPERATIONS
  // ================================================================
  
  /**
   * Read Excel file and return structured data
   */
  async readExcelFile(filePath, options = {}) {
    try {
      // Validate file
      const validation = await this.validateFile(filePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      
      // Read workbook
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        cellNF: false,
        cellHTML: false,
        ...options.readOptions
      });
      
      // Get sheet names
      const sheetNames = workbook.SheetNames;
      
      // Process specified sheet or first sheet
      const targetSheet = options.sheetName || sheetNames[0];
      const worksheet = workbook.Sheets[targetSheet];
      
      if (!worksheet) {
        return { 
          success: false, 
          error: `Sheet '${targetSheet}' not found` 
        };
      }
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: options.useFirstRowAsHeader !== false ? 1 : undefined,
        defval: '',
        raw: false,
        ...options.parseOptions
      });
      
      // Apply data transformations
      const transformedData = await this.transformData(data, options.transformations);
      
      // Update statistics
      this.stats.filesProcessed++;
      this.stats.rowsProcessed += data.length;
      this.stats.lastProcessed = new Date();
      
      return {
        success: true,
        data: transformedData,
        sheets: sheetNames,
        activeSheet: targetSheet,
        rowCount: data.length,
        columnCount: Object.keys(data[0] || {}).length
      };
      
    } catch (error) {
      this.stats.errorsEncountered++;
      this.emit('error', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
  
  /**
   * Read multiple Excel files
   */
  async readMultipleFiles(filePaths, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5;
    
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        const result = await this.readExcelFile(filePath, options);
        return { filePath, ...result };
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
      
      // Emit progress
      this.emit('readProgress', {
        completed: Math.min(i + batchSize, filePaths.length),
        total: filePaths.length,
        progress: Math.min(i + batchSize, filePaths.length) / filePaths.length
      });
    }
    
    return {
      success: true,
      results,
      summary: {
        total: filePaths.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
  
  // ================================================================
  // FILE WRITING OPERATIONS
  // ================================================================
  
  /**
   * Write data to Excel file
   */
  async writeExcelFile(filePath, data, options = {}) {
    try {
      // Validate data
      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: 'Data must be a non-empty array' };
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: options.headers || Object.keys(data[0]),
        skipHeader: options.skipHeader === true,
        ...options.writeOptions
      });
      
      // Apply formatting if specified
      if (options.formatting) {
        this.applyFormatting(worksheet, options.formatting);
      }
      
      // Set column widths
      if (options.columnWidths) {
        worksheet['!cols'] = options.columnWidths.map(width => ({ wch: width }));
      }
      
      // Add worksheet to workbook
      const sheetName = options.sheetName || this.config.defaultSheetName;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write file
      XLSX.writeFile(workbook, filePath, {
        bookType: 'xlsx',
        compression: true,
        ...options.fileOptions
      });
      
      return {
        success: true,
        filePath,
        rowCount: data.length,
        columnCount: Object.keys(data[0]).length
      };
      
    } catch (error) {
      this.emit('error', error);
      
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
  
  /**
   * Write multiple sheets to Excel file
   */
  async writeMultiSheetExcel(filePath, sheetsData, options = {}) {
    try {
      const workbook = XLSX.utils.book_new();
      
      for (const [sheetName, data] of Object.entries(sheetsData)) {
        if (!Array.isArray(data) || data.length === 0) continue;
        
        const worksheet = XLSX.utils.json_to_sheet(data, {
          header: options.headers?.[sheetName] || Object.keys(data[0]),
          ...options.writeOptions
        });
        
        // Apply sheet-specific formatting
        if (options.formatting?.[sheetName]) {
          this.applyFormatting(worksheet, options.formatting[sheetName]);
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
      
      XLSX.writeFile(workbook, filePath, {
        bookType: 'xlsx',
        compression: true,
        ...options.fileOptions
      });
      
      return { success: true, filePath, sheets: Object.keys(sheetsData) };
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  // ================================================================
  // TEMPLATE MANAGEMENT
  // ================================================================
  
  /**
   * Load Excel template
   */
  async loadTemplate(templateName) {
    try {
      // Check cache first
      if (this.templateCache.has(templateName)) {
        return { success: true, template: this.templateCache.get(templateName) };
      }
      
      const templatePath = path.join(__dirname, '..', '..', '..', 'templates', `${templateName}.xlsx`);
      
      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch {
        return { success: false, error: `Template '${templateName}' not found` };
      }
      
      // Read template
      const workbook = XLSX.readFile(templatePath);
      const template = {
        name: templateName,
        path: templatePath,
        sheets: workbook.SheetNames,
        workbook
      };
      
      // Cache template
      this.templateCache.set(templateName, template);
      
      return { success: true, template };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get available templates
   */
  async getAvailableTemplates() {
    try {
      const templatesDir = path.join(__dirname, '..', '..', '..', 'templates');
      const files = await fs.readdir(templatesDir);
      
      const templates = files
        .filter(file => path.extname(file).toLowerCase() === '.xlsx')
        .map(file => ({
          name: path.basename(file, '.xlsx'),
          fileName: file,
          path: path.join(templatesDir, file)
        }));
      
      return { success: true, templates };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create file from template
   */
  async createFromTemplate(templateName, outputPath, data, options = {}) {
    try {
      // Load template
      const templateResult = await this.loadTemplate(templateName);
      if (!templateResult.success) {
        return templateResult;
      }
      
      const template = templateResult.template;
      const workbook = { ...template.workbook };
      
      // Get target sheet
      const sheetName = options.sheetName || template.sheets[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        return { success: false, error: `Sheet '${sheetName}' not found in template` };
      }
      
      // Find data insertion point
      const insertionPoint = options.insertionPoint || { row: 2, col: 1 };
      
      // Insert data into template
      if (Array.isArray(data) && data.length > 0) {
        const dataRange = XLSX.utils.json_to_sheet(data, { header: Object.keys(data[0]) });
        
        // Merge data into existing worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const dataRangeDecoded = XLSX.utils.decode_range(dataRange['!ref']);
        
        // Copy data cells
        for (let R = 0; R <= dataRangeDecoded.e.r; ++R) {
          for (let C = 0; C <= dataRangeDecoded.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const targetRef = XLSX.utils.encode_cell({ 
              r: insertionPoint.row - 1 + R, 
              c: insertionPoint.col - 1 + C 
            });
            
            if (dataRange[cellRef]) {
              worksheet[targetRef] = dataRange[cellRef];
            }
          }
        }
        
        // Update range
        const newRange = {
          s: { r: 0, c: 0 },
          e: { 
            r: Math.max(range.e.r, insertionPoint.row - 1 + dataRangeDecoded.e.r),
            c: Math.max(range.e.c, insertionPoint.col - 1 + dataRangeDecoded.e.c)
          }
        };
        worksheet['!ref'] = XLSX.utils.encode_range(newRange);
      }
      
      // Write file
      XLSX.writeFile(workbook, outputPath);
      
      return {
        success: true,
        filePath: outputPath,
        template: templateName,
        rowsInserted: data.length
      };
      
    } catch (error) {
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }
  
  // ================================================================
  // DATA TRANSFORMATION
  // ================================================================
  
  /**
   * Transform data based on transformation rules
   */
  async transformData(data, transformations = {}) {
    if (!transformations || Object.keys(transformations).length === 0) {
      return data;
    }
    
    return data.map(row => {
      const transformedRow = { ...row };
      
      for (const [column, transformation] of Object.entries(transformations)) {
        if (transformation.type === 'rename' && transformation.to) {
          transformedRow[transformation.to] = transformedRow[column];
          delete transformedRow[column];
        } else if (transformation.type === 'format' && transformation.format) {
          transformedRow[column] = this.formatValue(transformedRow[column], transformation.format);
        } else if (transformation.type === 'calculate' && transformation.formula) {
          transformedRow[column] = this.calculateValue(transformedRow, transformation.formula);
        }
      }
      
      return transformedRow;
    });
  }
  
  /**
   * Format value based on format type
   */
  formatValue(value, format) {
    switch (format.type) {
      case 'date':
        return new Date(value).toLocaleDateString(format.locale || 'en-US');
      case 'currency':
        return new Intl.NumberFormat(format.locale || 'en-US', {
          style: 'currency',
          currency: format.currency || 'USD'
        }).format(value);
      case 'number':
        return Number(value).toFixed(format.decimals || 2);
      case 'text':
        return String(value);
      default:
        return value;
    }
  }
  
  /**
   * Calculate value based on formula
   */
  calculateValue(row, formula) {
    // Simple formula evaluation (extend as needed)
    try {
      // Replace column references with actual values
      let expression = formula;
      for (const [key, value] of Object.entries(row)) {
        expression = expression.replace(new RegExp(`\\b${key}\\b`, 'g'), value || 0);
      }
      
      // Evaluate simple mathematical expressions
      return Function(`"use strict"; return (${expression})`)();
    } catch {
      return 0;
    }
  }
  
  // ================================================================
  // VALIDATION AND UTILITIES
  // ================================================================
  
  /**
   * Validate Excel file
   */
  async validateFile(filePath) {
    try {
      // Check if file exists
      const stats = await fs.stat(filePath);
      
      // Check file size
      if (stats.size > this.config.maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size (${this.config.maxFileSize / 1024 / 1024}MB)`
        };
      }
      
      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      if (!this.config.supportedFormats.includes(ext)) {
        return {
          valid: false,
          error: `Unsupported file format. Supported formats: ${this.config.supportedFormats.join(', ')}`
        };
      }
      
      return { valid: true };
      
    } catch (error) {
      return { valid: false, error: `Cannot access file: ${error.message}` };
    }
  }
  
  /**
   * Apply formatting to worksheet
   */
  applyFormatting(worksheet, formatting) {
    // Apply formatting rules (implementation would depend on requirements)
    if (formatting.headerStyle) {
      // Apply header formatting
    }
    
    if (formatting.dataStyle) {
      // Apply data formatting
    }
    
    if (formatting.borders) {
      // Apply borders
    }
  }
  
  /**
   * Get service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      templatesLoaded: this.templateCache.size,
      cacheSize: this.templateCache.size
    };
  }
  
  /**
   * Clear template cache
   */
  clearCache() {
    this.templateCache.clear();
  }
  
  /**
   * Detect template type from Excel file columns
   */
  async detectTemplateType(filePath) {
    try {
      const result = await this.readExcelFile(filePath, { 
        useFirstRowAsHeader: true,
        parseOptions: { range: 1 } // Read only header row
      });
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      const columns = Object.keys(result.data[0] || {});
      
      // Template matching patterns
      const templatePatterns = {
        'sales': [
          'Supplier invoice no', 'Date', 'To ( Party Name )', 
          'Purchase 5%', 'Purchase 12%', 'Purchase 18%', 
          'CGST', 'SGST', 'TOTAL', 'Narration'
        ],
        'purchase': [
          'Supplier invoice no', 'Date', 'To ( Party Name )', 
          'Purchase 5%', 'Purchase 12%', 'Purchase 18%', 
          'CGST', 'SGST', 'TOTAL', 'Narration'
        ],
        'journal': [
          'Supplier invoice no', 'Date', 'To ( Party Name )', 
          'Purchase 5%', 'Purchase 12%', 'Purchase 18%', 
          'CGST', 'SGST', 'TOTAL', 'Narration'
        ],
        'bank': [
          'Date*', 'Vch Type*', 'Narration', 'Cheque No.', 
          'Ledger*', 'DR/CR', 'Single Amount', 'Withdrawal*', 'Deposit*'
        ]
      };
      
      // Find best matching template
      let bestMatch = null;
      let highestScore = 0;
      
      for (const [templateType, expectedColumns] of Object.entries(templatePatterns)) {
        const matchedColumns = expectedColumns.filter(col => 
          columns.some(fileCol => 
            fileCol.toLowerCase().trim() === col.toLowerCase().trim() ||
            fileCol.toLowerCase().trim().includes(col.toLowerCase().trim()) ||
            col.toLowerCase().trim().includes(fileCol.toLowerCase().trim())
          )
        );
        
        const score = matchedColumns.length / expectedColumns.length;
        
        if (score > highestScore && score > 0.6) { // At least 60% match
          highestScore = score;
          bestMatch = templateType;
        }
      }
      
      return {
        success: true,
        templateType: bestMatch,
        confidence: highestScore,
        detectedColumns: columns,
        suggestions: bestMatch ? `Detected as ${bestMatch} template with ${Math.round(highestScore * 100)}% confidence` : 'No template pattern detected'
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate data against template structure
   */
  async validateAgainstTemplate(data, templateType) {
    try {
      const templatePatterns = {
        'sales': {
          required: ['Supplier invoice no', 'Date', 'To ( Party Name )', 'TOTAL'],
          optional: ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST', 'Narration'],
          calculations: {
            'TOTAL': ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST']
          }
        },
        'purchase': {
          required: ['Supplier invoice no', 'Date', 'To ( Party Name )', 'TOTAL'],
          optional: ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST', 'Narration'],
          calculations: {
            'TOTAL': ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST']
          }
        },
        'journal': {
          required: ['Supplier invoice no', 'Date', 'To ( Party Name )', 'TOTAL'],
          optional: ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST', 'Narration'],
          calculations: {
            'TOTAL': ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST']
          }
        },
        'bank': {
          required: ['Date*', 'Vch Type*', 'Ledger*'],
          optional: ['Narration', 'Cheque No.', 'DR/CR', 'Single Amount', 'Withdrawal*', 'Deposit*'],
          calculations: {}
        }
      };
      
      const template = templatePatterns[templateType];
      if (!template) {
        return { success: false, error: `Unknown template type: ${templateType}` };
      }
      
      const errors = [];
      const warnings = [];
      
      // Validate each row
      data.forEach((row, index) => {
        const rowNum = index + 2; // Account for header row
        
        // Check required fields
        template.required.forEach(field => {
          const fieldValue = row[field];
          if (!fieldValue || fieldValue.toString().trim() === '') {
            errors.push(`Row ${rowNum}: ${field} is required but empty`);
          }
        });
        
        // Validate data types and formats
        if (row['Date'] || row['Date*']) {
          const dateField = row['Date'] || row['Date*'];
          if (dateField && !moment(dateField).isValid()) {
            errors.push(`Row ${rowNum}: Invalid date format`);
          }
        }
        
        // Validate numeric fields
        const numericFields = ['Purchase 5%', 'Purchase 12%', 'Purchase 18%', 'CGST', 'SGST', 'TOTAL', 'Single Amount', 'Withdrawal*', 'Deposit*'];
        numericFields.forEach(field => {
          const value = row[field];
          if (value !== undefined && value !== '' && isNaN(Number(value))) {
            errors.push(`Row ${rowNum}: ${field} must be a valid number`);
          }
        });
        
        // Check calculations for non-bank templates
        if (templateType !== 'bank' && template.calculations['TOTAL']) {
          const calculatedTotal = template.calculations['TOTAL'].reduce((sum, field) => {
            const value = Number(row[field]) || 0;
            return sum + value;
          }, 0);
          
          const actualTotal = Number(row['TOTAL']) || 0;
          const tolerance = 0.01; // Allow 1 paisa difference
          
          if (Math.abs(calculatedTotal - actualTotal) > tolerance) {
            warnings.push(`Row ${rowNum}: TOTAL (${actualTotal}) doesn't match calculated sum (${calculatedTotal.toFixed(2)})`);
          }
        }
      });
      
      return {
        success: errors.length === 0,
        errors,
        warnings,
        validRows: data.length - errors.length,
        totalRows: data.length
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new ExcelService();
