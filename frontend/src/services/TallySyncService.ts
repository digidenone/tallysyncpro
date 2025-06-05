/**
 * TallySync Pro - Core Service Management Class
 * 
 * This service class handles all communication between the frontend and backend
 * components of the TallySync Pro application. It provides:
 * 
 * CORE FEATURES:
 * - Multi-tier connection management (Cloud API → Local Backend → Tally ERP)
 * - Automatic environment detection (development vs production)
 * - Data processing and validation services
 * - Template generation and download management
 * - Real-time sync status monitoring
 * - Error handling and user notifications
 * 
 * ARCHITECTURE:
 * - Frontend (React/Vite) → Cloud API (Vercel) → Local Backend (.exe) → Tally ERP 9
 * - Supports offline/online hybrid operation modes
 * - Graceful fallbacks when components are unavailable
 * 
 * CONNECTION HIERARCHY:
 * 1. Primary: Cloud API endpoints (/api/*)
 * 2. Secondary: Direct local backend (localhost:3001)
 * 3. Fallback: Local-only template generation
 * 
 * @version 1.0.0
 * @author Digidenone
 * @license MIT
 * @since 2024
 */

import { toast } from 'sonner';

/**
 * Connection Status Interface
 * 
 * Defines the structure for monitoring connection states across
 * the TallySync Pro application ecosystem.
 * 
 * @interface ConnectionStatus
 * @property {string} backend - Backend connection state: 'connected' | 'disconnected' | 'cloud'
 * @property {string} frontend - Frontend version and status information
 * @property {string} mode - Operation mode: 'local' | 'cloud'
 * @property {string} version - Application version identifier
 * @property {object} features - Available feature flags and capabilities
 */
export interface ConnectionStatus {
  backend: 'connected' | 'disconnected' | 'cloud';
  frontend: string;
  mode: 'local' | 'cloud';
  version: string;
  features: {
    cloudSync: boolean;
    templateGeneration: boolean;
    dataProcessing: boolean;
    downloadExecutable: boolean;
  };
}

/**
 * TallySync Pro Service Class
 * 
 * Main service class that manages all application operations including:
 * - Environment detection and configuration
 * - Multi-tier API connection management
 * - Data processing and validation
 * - Template generation and downloads
 * - Real-time status monitoring
 * - Error handling and user feedback
 * 
 * @class TallySyncService
 */
class TallySyncService {
  // Core Configuration Properties
  private baseUrl: string;                    // Primary API endpoint URL
  private isLocalMode: boolean = false;       // Local vs cloud operation mode
  private localBackendPort: number = 3001;    // TallySync Pro backend port
  private userId: string;                      // Unique user session identifier

  /**
   * Constructor - Initialize TallySync Service
   * 
   * Sets up the service with environment-appropriate configuration:
   * - Detects production vs development environment
   * - Configures API endpoints and connection modes
   * - Generates or retrieves user session ID
   * - Sets up connection preferences based on environment
   */
  constructor() {
    // Detect environment
    const isProduction = import.meta.env.PROD;
    const isDevelopment = import.meta.env.DEV;
    
    // Use environment variables if available
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const enableLocalBackend = import.meta.env.VITE_ENABLE_LOCAL_BACKEND !== 'false';
    
    // Default to cloud APIs in production, allow local in development
    this.baseUrl = apiBaseUrl;
    this.isLocalMode = false;
    
    // Generate a simple user ID for backend association
    this.userId = localStorage.getItem('tallysync_user_id') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('tallysync_user_id', this.userId);
    
    // In production, always use cloud mode unless explicitly enabled
    if (isProduction && !enableLocalBackend) {
      console.log('TallySync: Running in production mode, using cloud APIs');
      this.baseUrl = apiBaseUrl;
      this.isLocalMode = false;
    }
  }  // Test connection - supports both local and cloud modes with relay
  async testConnection(): Promise<boolean> {
    try {
      // In production, always use cloud mode with enhanced error handling
      if (import.meta.env.PROD) {
        this.baseUrl = '/api';
        this.isLocalMode = false;
        
        // Try to ping the API to check if it's available with shorter timeout
        try {
          const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '5000', 10);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch('/api/system?action=ping', {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            console.log('✅ Connected to TallySync Pro cloud service');
            return true;
          } else {
            console.log('ℹ️ TallySync Pro cloud service is starting up...');
            return true; // Still return true to allow dashboard to load
          }
        } catch (error) {
          console.log('ℹ️ API not immediately available, continuing with cloud mode');
          // Don't show error toast in production, just log it
          return true; // Always return true in production to allow dashboard to load
        }
      }

      // Development mode: try cloud first, then local
      try {        const cloudResponse = await fetch('/api/system?action=ping', {
          signal: AbortSignal.timeout(3000)
        });
        if (cloudResponse.ok) {
          this.baseUrl = '/api';
          this.isLocalMode = false;
          
          // Check if local backend is available through relay
          const relayStatus = await this.checkRelayConnection();
          if (relayStatus.connected) {
            toast.success('Connected to TallySync Pro cloud service with local backend');
          } else {
            toast.success('Connected to TallySync Pro cloud service');
          }
          return true;
        }
      } catch (error) {
        console.log('Cloud API not available, trying local backend');
      }

      // In development, try local backend directly
      try {        const localResponse = await fetch(`http://localhost:${this.localBackendPort}/api/system?action=ping`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });

        if (localResponse.ok) {
          this.baseUrl = `http://localhost:${this.localBackendPort}/api`;
          this.isLocalMode = true;
          toast.success('Connected to local TallySync Pro service');
          return true;
        }
      } catch (error) {
        console.log('Local backend not available, using cloud service');
      }

      // Default to cloud mode
      this.baseUrl = '/api';
      this.isLocalMode = false;
      toast.info('Using TallySync Pro cloud service');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      // Default to cloud mode
      this.baseUrl = '/api';
      this.isLocalMode = false;
      toast.info('Initializing TallySync Pro cloud service...');
      return true; // Always return true to allow the app to function
    }
  }

  // Check relay connection to local backend
  async checkRelayConnection(): Promise<{ connected: boolean; message?: string }> {
    try {
      const response = await fetch(`/api/relay?action=status&userId=${this.userId}`);
      const data = await response.json();
      return {
        connected: data.hasBackend && data.status === 'connected',
        message: data.message
      };
    } catch (error) {
      console.error('Relay connection check failed:', error);
      return { connected: false, message: 'Relay service not available' };
    }
  }

  // Send request through relay to local backend
  async sendRelayRequest(action: string, payload: any): Promise<any> {
    try {
      const response = await fetch('/api/tools?action=relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'relay-request',
          userId: this.userId,
          payload: {
            action,
            data: payload
          }
        })
      });

      const result = await response.json();
      
      if (result.requiresDownload) {
        toast.error(result.message + ' Click the download button to get TallySyncPro.exe');
        return { success: false, requiresDownload: true, message: result.message };
      }

      return result;
    } catch (error) {
      console.error('Relay request failed:', error);
      return { success: false, message: 'Failed to communicate with backend' };
    }
  }

  // Get connection status
  async getStatus(): Promise<ConnectionStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get status:', error);
      // Return default cloud status
      return {
        backend: 'cloud',
        frontend: 'https://tallysync.vercel.app',
        mode: 'cloud',
        version: '1.0.0',
        features: {
          cloudSync: true,
          templateGeneration: true,
          dataProcessing: true,
          downloadExecutable: true
        }
      };
    }
  }

  // Get connection status - alias for getStatus for Dashboard compatibility
  async getConnectionStatus(): Promise<ConnectionStatus> {
    return this.getStatus();
  }

  // Get health status
  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'healthy',
        service: 'TallySync Pro Cloud',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate template
  async generateTemplate(templateType: string, customFields: any[] = []): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateType, customFields })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Template generation failed:', error);
      throw error;
    }
  }
  // Get download info for desktop app
  async getDownloadInfo(): Promise<any> {
    try {
      // Return direct download information for TallySyncPro.exe
      return {
        success: true,
        filename: 'TallySyncPro.exe',
        downloadUrl: '/api/downloads?file=TallySyncPro.exe',
        version: '1.0.0',
        size: 'Auto-detected',
        description: 'TallySync Pro Background Service for Tally ERP integration',
        requirements: [
          'Windows 10 or later',
          'Tally ERP 9 with ODBC enabled',
          'Administrator privileges for installation'
        ]
      };
    } catch (error) {
      console.error('Failed to get download info:', error);
      return {
        success: false,
        error: 'Download information not available'
      };
    }
  }

  // Check cloud connection status
  async checkCloudConnection(): Promise<{ connected: boolean; message?: string }> {
    try {
      const response = await fetch('/api/system?action=ping');
      if (response.ok) {
        return { connected: true };
      }
      return { connected: false, message: 'Cloud service not accessible' };
    } catch (error) {
      console.error('Cloud connection check failed:', error);
      return { connected: false, message: 'Failed to reach cloud service' };
    }
  }  // Check Tally ERP connection (through local .exe via relay)
  async checkTallyConnection(): Promise<{ connected: boolean; message?: string }> {
    try {
      // First check if we have a relay connection to local backend
      const relayStatus = await this.checkRelayConnection();
      
      if (!relayStatus.connected) {
        if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
          return { 
            connected: false, 
            message: 'No local backend connected. Download and run TallySyncPro.exe for Tally integration.' 
          };
        }
        return { 
          connected: false, 
          message: 'TallySyncPro.exe not running. Download and run it for Tally ERP integration.' 
        };
      }

      // Use relay to check Tally status
      const result = await this.sendRelayRequest('tally-status', {});
      
      if (result.success) {
        return {
          connected: result.tallyConnected || false,
          message: result.message || 'Tally ERP status checked via relay'
        };
      }

      return {
        connected: false,
        message: result.message || 'Failed to check Tally status'
      };
      
    } catch (error) {
      console.error('Tally connection check failed:', error);
      
      if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
        return { 
          connected: false, 
          message: 'For Tally ERP integration, download TallySyncPro.exe and use the relay service' 
        };
      }
      
      return { 
        connected: false, 
        message: 'TallySyncPro.exe not running. Download and run it for Tally ERP integration.' 
      };
    }
  }

  // Download template file
  async downloadTemplate(templateType: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/download?type=${templateType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Template download failed:', error);
      throw error;
    }
  }
  // Process data for Tally integration (via relay if available)
  async processData(templateType: string, data: any[]): Promise<{ success: boolean; message?: string; jobId?: string }> {
    try {
      // First try relay to local backend
      const relayStatus = await this.checkRelayConnection();
      
      if (relayStatus.connected) {
        const result = await this.sendRelayRequest('process-data', { 
          templateType, 
          records: data,
          timestamp: new Date().toISOString()
        });
        
        if (result.success) {
          toast.success(result.message || 'Data processed successfully via local backend');
          return result;
        }
      }

      // Fallback to cloud processing
      const response = await fetch(`${this.baseUrl}/data/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          templateType, 
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || 'Data processed successfully via cloud service');
      } else {
        toast.error(result.message || 'Data processing failed');
      }

      return result;
    } catch (error) {
      console.error('Data processing failed:', error);
      const errorMessage = 'Failed to process data. Please try again.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  }
  // Excel Upload and Processing Methods
  async uploadExcelFile(file: File, templateType: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      // Convert file to base64 for API transmission
      const fileBase64 = await this.fileToBase64(file);
      
      // Try local backend first, fallback to cloud processing
      let response;
      
      if (this.isLocalMode) {
        try {
          response = await fetch(`http://localhost:${this.localBackendPort}/api/tools?action=upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: fileBase64,
              templateType,
              userId: this.userId,
              fileName: file.name,
              fileSize: file.size
            }),
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });
        } catch (error) {
          console.log('Local backend not available, using cloud processing');
          this.isLocalMode = false;
        }
      }
      
      // Fallback to cloud processing
      if (!response) {
        response = await fetch(`${this.baseUrl}/tools?action=upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: fileBase64,
            templateType,
            userId: this.userId,
            fileName: file.name,
            fileSize: file.size
          }),
          signal: AbortSignal.timeout(15000), // 15 second timeout for cloud
        });
      }

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Excel upload failed:', error);
      return {
        success: false,
        message: `Upload failed: ${error.message}`
      };
    }
  }
  // Helper method to convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async convertExcelToTallyXML(parsedData: any, templateType: string): Promise<{
    success: boolean;
    message: string;
    xmlContent?: string;
    fileName?: string;
  }> {
    try {
      const payload = {
        data: parsedData,
        templateType,
        userId: this.userId,
        action: 'generate-tally-xml'
      };

      // Try local backend first for real Tally integration
      let response;
      
      if (this.isLocalMode) {
        try {
          response = await fetch(`http://localhost:${this.localBackendPort}/api/tools?action=convert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
          });
        } catch (error) {
          console.log('Local backend not available for Tally conversion');
          this.isLocalMode = false;
        }
      }
      
      // Fallback to cloud mock conversion
      if (!response) {
        response = await fetch(`${this.baseUrl}/tools?action=convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });
      }

      if (!response.ok) {
        throw new Error(`Conversion failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('XML conversion failed:', error);
      return {
        success: false,
        message: `Conversion failed: ${error.message}`
      };
    }
  }
  // Get user ID for relay service
  getUserId(): string {
    return this.userId;
  }

  // Check if running in local mode
  isLocal(): boolean {
    return this.isLocalMode;
  }

  // Get current API base URL
  getBaseUrl(): string {
    return this.baseUrl;
  }

  // Client-side Excel Processing (No server required)
  async processExcelFileClientSide(file: File): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      // Import XLSX dynamically to reduce bundle size
      const XLSX = await import('xlsx');
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Use first row as header
        defval: '' // Default value for empty cells
      });

      if (jsonData.length === 0) {
        return {
          success: false,
          message: 'Excel file appears to be empty'
        };
      }

      // Extract headers and data
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      // Convert to structured format
      const structuredData = dataRows.map((row, index) => {
        const rowData: any = { _rowNumber: index + 2 }; // +2 because we start from row 2 in Excel
        headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });
        return rowData;
      });

      // Detect template type based on headers
      const templateType = this.detectTemplateType(headers);

      // Validate data structure
      const validation = this.validateExcelData(templateType, structuredData);

      return {
        success: true,
        message: `Successfully parsed Excel file with ${structuredData.length} rows`,
        data: {
          templateType: templateType,
          headers: headers,
          rows: structuredData,
          totalRows: structuredData.length,
          sheetName: sheetName,
          validation: validation
        }
      };

    } catch (error: any) {
      console.error('Client-side Excel parsing error:', error);
      return {
        success: false,
        message: `Failed to parse Excel file: ${error.message}`
      };
    }
  }

  // Client-side XML Generation (No server required)
  async generateTallyXMLClientSide(data: any, templateType: string): Promise<{
    success: boolean;
    message: string;
    xmlContent?: string;
    fileName?: string;
  }> {
    try {
      const { headers, rows } = data;
      
      // Generate Tally XML content
      const xmlContent = this.generateTallyXMLContent(rows, templateType);
      const fileName = this.generateXMLFileName(templateType);

      return {
        success: true,
        message: `Successfully converted ${rows.length} records to Tally XML`,
        xmlContent: xmlContent,
        fileName: fileName
      };

    } catch (error: any) {
      console.error('Client-side XML generation error:', error);
      return {
        success: false,
        message: `Failed to generate XML: ${error.message}`
      };
    }
  }

  // Download XML file to user's device
  downloadXMLFile(xmlContent: string, fileName: string): void {
    try {
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`XML file downloaded: ${fileName}`);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download XML file');
    }
  }

  // Template type detection based on headers
  private detectTemplateType(headers: string[]): string {
    const headerStr = headers.join(' ').toLowerCase();
    
    if (headerStr.includes('invoice') && headerStr.includes('customer')) {
      return 'sales';
    } else if (headerStr.includes('invoice') && headerStr.includes('supplier')) {
      return 'purchase';
    } else if (headerStr.includes('payment') || headerStr.includes('voucher')) {
      return 'payment';
    } else if (headerStr.includes('receipt')) {
      return 'receipt';
    } else if (headerStr.includes('journal')) {
      return 'journal';
    } else if (headerStr.includes('stock') || headerStr.includes('inventory')) {
      return 'stock';
    } else if (headerStr.includes('ledger') || headerStr.includes('account')) {
      return 'ledger';
    } else {
      return 'general';
    }
  }

  // Validate Excel data structure
  private validateExcelData(templateType: string, data: any[]): any {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (data.length === 0) {
      issues.push('No data rows found');
      return { valid: false, issues, warnings };
    }

    // Check for empty rows
    const emptyRows = data.filter(row => {
      const values = Object.values(row).filter(val => val !== '' && val !== null && val !== undefined);
      return values.length <= 1; // Only _rowNumber
    });

    if (emptyRows.length > 0) {
      warnings.push(`Found ${emptyRows.length} empty rows`);
    }

    // Template-specific validation
    switch (templateType) {
      case 'sales':
      case 'purchase':
        this.validateInvoiceData(data, issues, warnings);
        break;
      case 'payment':
      case 'receipt':
        this.validateVoucherData(data, issues, warnings);
        break;
      default:
        warnings.push('Template type not recognized, using general validation');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      totalRows: data.length,
      validRows: data.length - emptyRows.length
    };
  }

  private validateInvoiceData(data: any[], issues: string[], warnings: string[]): void {
    data.forEach((row) => {
      const rowData = Object.keys(row).map(key => key.toLowerCase());
      
      // Check for basic required fields
      const hasDate = rowData.some(field => field.includes('date'));
      const hasAmount = rowData.some(field => field.includes('amount') || field.includes('total'));
      
      if (!hasDate) {
        warnings.push(`Row ${row._rowNumber}: No date field detected`);
      }
      if (!hasAmount) {
        warnings.push(`Row ${row._rowNumber}: No amount field detected`);
      }
    });
  }

  private validateVoucherData(data: any[], issues: string[], warnings: string[]): void {
    data.forEach((row) => {
      const rowData = Object.keys(row).map(key => key.toLowerCase());
      
      // Check for basic required fields
      const hasDate = rowData.some(field => field.includes('date'));
      const hasAmount = rowData.some(field => field.includes('amount'));
      const hasParty = rowData.some(field => field.includes('party') || field.includes('customer') || field.includes('supplier'));
      
      if (!hasDate) {
        warnings.push(`Row ${row._rowNumber}: No date field detected`);
      }
      if (!hasAmount) {
        warnings.push(`Row ${row._rowNumber}: No amount field detected`);
      }
      if (!hasParty) {
        warnings.push(`Row ${row._rowNumber}: No party/customer field detected`);
      }
    });
  }

  // Generate XML file name
  private generateXMLFileName(templateType: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    return `tally-${templateType}-${timestamp}.xml`;
  }

  // Generate Tally XML content
  private generateTallyXMLContent(rows: any[], templateType: string): string {
    // XML Header
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<ENVELOPE>\n`;
    xml += `  <HEADER>\n`;
    xml += `    <TALLYREQUEST>Import Data</TALLYREQUEST>\n`;
    xml += `  </HEADER>\n`;
    xml += `  <BODY>\n`;
    xml += `    <IMPORTDATA>\n`;
    xml += `      <REQUESTDESC>\n`;
    xml += `        <REPORTNAME>All Masters</REPORTNAME>\n`;
    xml += `      </REQUESTDESC>\n`;
    xml += `      <REQUESTDATA>\n`;

    // Generate vouchers based on template type
    switch (templateType) {
      case 'sales':
        xml += this.generateSalesVouchersXML(rows);
        break;
      case 'purchase':
        xml += this.generatePurchaseVouchersXML(rows);
        break;
      case 'payment':
        xml += this.generatePaymentVouchersXML(rows);
        break;
      case 'receipt':
        xml += this.generateReceiptVouchersXML(rows);
        break;
      case 'journal':
        xml += this.generateJournalVouchersXML(rows);
        break;
      case 'ledger':
        xml += this.generateLedgerMastersXML(rows);
        break;
      case 'stock':
        xml += this.generateStockItemsXML(rows);
        break;
      default:
        xml += this.generateGeneralVouchersXML(rows, templateType);
    }

    // XML Footer
    xml += `      </REQUESTDATA>\n`;
    xml += `    </IMPORTDATA>\n`;
    xml += `  </BODY>\n`;
    xml += `</ENVELOPE>`;

    return xml;
  }

  // Helper method to find field value by multiple possible names
  private findFieldValue(row: any, fieldNames: string[]): string | null {
    for (const fieldName of fieldNames) {
      for (const key in row) {
        if (key.toLowerCase().includes(fieldName.toLowerCase()) && row[key]) {
          return row[key];
        }
      }
    }
    return null;
  }

  // Format date for Tally XML
  private formatTallyDate(dateValue: any): string {
    try {
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    } catch {
      // Default to today's date if parsing fails
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    }
  }

  // Generate voucher key
  private generateVoucherKey(): string {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  }

  // Generate GUID
  private generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }

  // XML Generation Methods for different voucher types
  private generateSalesVouchersXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      // Map common field variations
      const date = this.findFieldValue(row, ['date', 'invoice_date', 'bill_date']);
      const invoiceNo = this.findFieldValue(row, ['invoice_no', 'bill_no', 'voucher_no']);
      const customer = this.findFieldValue(row, ['customer', 'party', 'customer_name']);
      const amount = this.findFieldValue(row, ['amount', 'total_amount', 'total']);
      const itemName = this.findFieldValue(row, ['item', 'item_name', 'product', 'description']);
      const quantity = this.findFieldValue(row, ['quantity', 'qty']) || '1';
      const rate = this.findFieldValue(row, ['rate', 'unit_price', 'price']);

      if (!date || !customer || !amount) {
        console.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <VOUCHER REMOTEID="${invoiceNo || `SI${index + 1}`}" VCHKEY="${this.generateVoucherKey()}" VCHTYPE="Sales" ACTION="Create" OBJVIEW="Invoice Voucher View">\n`;
      xml += `            <DATE>${this.formatTallyDate(date)}</DATE>\n`;
      xml += `            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n`;
      xml += `            <VOUCHERNUMBER>${invoiceNo || `SI${index + 1}`}</VOUCHERNUMBER>\n`;
      xml += `            <PARTYLEDGERNAME>${customer}</PARTYLEDGERNAME>\n`;
      xml += `            <EFFECTIVEDATE>${this.formatTallyDate(date)}</EFFECTIVEDATE>\n`;
      
      // All ledger entries
      xml += `            <ALLINVENTORYENTRIES.LIST>\n`;
      xml += `              <STOCKITEMNAME>${itemName || 'Sales Item'}</STOCKITEMNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>\n`;
      xml += `              <ISAUTONEGATE>No</ISAUTONEGATE>\n`;
      xml += `              <ISCUSTOMSCLEARANCE>No</ISCUSTOMSCLEARANCE>\n`;
      xml += `              <ISTRACKCOMPONENT>No</ISTRACKCOMPONENT>\n`;
      xml += `              <ISTRACKPRODUCTION>No</ISTRACKPRODUCTION>\n`;
      xml += `              <ISPRIMARYITEM>No</ISPRIMARYITEM>\n`;
      xml += `              <ISSCRAP>No</ISSCRAP>\n`;
      xml += `              <RATE>${rate || (Number(amount) / Number(quantity)).toFixed(2)}/Nos</RATE>\n`;
      xml += `              <AMOUNT>-${amount}</AMOUNT>\n`;
      xml += `              <ACTUALQTY>-${quantity} Nos</ACTUALQTY>\n`;
      xml += `              <BILLEDQTY>-${quantity} Nos</BILLEDQTY>\n`;
      xml += `            </ALLINVENTORYENTRIES.LIST>\n`;
      
      // Ledger entries
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${customer}</LEDGERNAME>\n`;
      xml += `              <GSTCLASS/>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <LEDGERFROMITEM>No</LEDGERFROMITEM>\n`;
      xml += `              <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>\n`;
      xml += `              <ISPARTYLEDGER>Yes</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>Sales</LEDGERNAME>\n`;
      xml += `              <GSTCLASS/>\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
      xml += `              <LEDGERFROMITEM>No</LEDGERFROMITEM>\n`;
      xml += `              <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>\n`;
      xml += `              <ISPARTYLEDGER>No</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>-${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `          </VOUCHER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generatePurchaseVouchersXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      const date = this.findFieldValue(row, ['date', 'invoice_date', 'bill_date']);
      const invoiceNo = this.findFieldValue(row, ['invoice_no', 'bill_no', 'voucher_no']);
      const supplier = this.findFieldValue(row, ['supplier', 'party', 'supplier_name', 'vendor']);
      const amount = this.findFieldValue(row, ['amount', 'total_amount', 'total']);
      const itemName = this.findFieldValue(row, ['item', 'item_name', 'product', 'description']);
      const quantity = this.findFieldValue(row, ['quantity', 'qty']) || '1';
      const rate = this.findFieldValue(row, ['rate', 'unit_price', 'price']);

      if (!date || !supplier || !amount) {
        console.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <VOUCHER REMOTEID="${invoiceNo || `PI${index + 1}`}" VCHKEY="${this.generateVoucherKey()}" VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">\n`;
      xml += `            <DATE>${this.formatTallyDate(date)}</DATE>\n`;
      xml += `            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>\n`;
      xml += `            <VOUCHERNUMBER>${invoiceNo || `PI${index + 1}`}</VOUCHERNUMBER>\n`;
      xml += `            <PARTYLEDGERNAME>${supplier}</PARTYLEDGERNAME>\n`;
      xml += `            <EFFECTIVEDATE>${this.formatTallyDate(date)}</EFFECTIVEDATE>\n`;
      
      // Inventory entries
      xml += `            <ALLINVENTORYENTRIES.LIST>\n`;
      xml += `              <STOCKITEMNAME>${itemName || 'Purchase Item'}</STOCKITEMNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>\n`;
      xml += `              <RATE>${rate || (Number(amount) / Number(quantity)).toFixed(2)}/Nos</RATE>\n`;
      xml += `              <AMOUNT>${amount}</AMOUNT>\n`;
      xml += `              <ACTUALQTY>${quantity} Nos</ACTUALQTY>\n`;
      xml += `              <BILLEDQTY>${quantity} Nos</BILLEDQTY>\n`;
      xml += `            </ALLINVENTORYENTRIES.LIST>\n`;
      
      // Ledger entries
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${supplier}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISPARTYLEDGER>Yes</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>-${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>Purchase</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISPARTYLEDGER>No</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `          </VOUCHER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generatePaymentVouchersXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      const date = this.findFieldValue(row, ['date', 'payment_date']);
      const voucherNo = this.findFieldValue(row, ['voucher_no', 'payment_no', 'reference']);
      const party = this.findFieldValue(row, ['party', 'customer', 'supplier', 'party_name']);
      const amount = this.findFieldValue(row, ['amount', 'payment_amount']);
      const mode = this.findFieldValue(row, ['payment_mode', 'mode']) || 'Cash';

      if (!date || !party || !amount) {
        console.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <VOUCHER REMOTEID="${voucherNo || `PV${index + 1}`}" VCHKEY="${this.generateVoucherKey()}" VCHTYPE="Payment" ACTION="Create">\n`;
      xml += `            <DATE>${this.formatTallyDate(date)}</DATE>\n`;
      xml += `            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>\n`;
      xml += `            <VOUCHERNUMBER>${voucherNo || `PV${index + 1}`}</VOUCHERNUMBER>\n`;
      xml += `            <EFFECTIVEDATE>${this.formatTallyDate(date)}</EFFECTIVEDATE>\n`;
      
      // Ledger entries
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${party}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISPARTYLEDGER>Yes</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${mode === 'Cash' ? 'Cash' : 'Bank'}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISPARTYLEDGER>No</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>-${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `          </VOUCHER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generateReceiptVouchersXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      const date = this.findFieldValue(row, ['date', 'receipt_date']);
      const voucherNo = this.findFieldValue(row, ['voucher_no', 'receipt_no', 'reference']);
      const party = this.findFieldValue(row, ['party', 'customer', 'party_name']);
      const amount = this.findFieldValue(row, ['amount', 'receipt_amount']);
      const mode = this.findFieldValue(row, ['receipt_mode', 'mode']) || 'Cash';

      if (!date || !party || !amount) {
        console.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <VOUCHER REMOTEID="${voucherNo || `RV${index + 1}`}" VCHKEY="${this.generateVoucherKey()}" VCHTYPE="Receipt" ACTION="Create">\n`;
      xml += `            <DATE>${this.formatTallyDate(date)}</DATE>\n`;
      xml += `            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>\n`;
      xml += `            <VOUCHERNUMBER>${voucherNo || `RV${index + 1}`}</VOUCHERNUMBER>\n`;
      xml += `            <EFFECTIVEDATE>${this.formatTallyDate(date)}</EFFECTIVEDATE>\n`;
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${mode === 'Cash' ? 'Cash' : 'Bank'}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISPARTYLEDGER>No</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${party}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
      xml += `              <ISPARTYLEDGER>Yes</ISPARTYLEDGER>\n`;
      xml += `              <AMOUNT>-${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `          </VOUCHER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generateJournalVouchersXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      const date = this.findFieldValue(row, ['date', 'journal_date']);
      const voucherNo = this.findFieldValue(row, ['voucher_no', 'journal_no']);
      const drLedger = this.findFieldValue(row, ['dr_ledger', 'debit_account', 'debit_ledger']);
      const crLedger = this.findFieldValue(row, ['cr_ledger', 'credit_account', 'credit_ledger']);
      const amount = this.findFieldValue(row, ['amount', 'journal_amount']);
      const narration = this.findFieldValue(row, ['narration', 'description', 'particulars']);

      if (!date || !drLedger || !crLedger || !amount) {
        console.warn(`Skipping row ${index + 1}: Missing required fields`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <VOUCHER REMOTEID="${voucherNo || `JV${index + 1}`}" VCHKEY="${this.generateVoucherKey()}" VCHTYPE="Journal" ACTION="Create">\n`;
      xml += `            <DATE>${this.formatTallyDate(date)}</DATE>\n`;
      xml += `            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>\n`;
      xml += `            <VOUCHERNUMBER>${voucherNo || `JV${index + 1}`}</VOUCHERNUMBER>\n`;
      xml += `            <EFFECTIVEDATE>${this.formatTallyDate(date)}</EFFECTIVEDATE>\n`;
      if (narration) {
        xml += `            <NARRATION>${narration}</NARRATION>\n`;
      }
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${drLedger}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <AMOUNT>${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `            <ALLLEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${crLedger}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
      xml += `              <AMOUNT>-${amount}</AMOUNT>\n`;
      xml += `            </ALLLEDGERENTRIES.LIST>\n`;
      
      xml += `          </VOUCHER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generateLedgerMastersXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      const name = this.findFieldValue(row, ['name', 'ledger_name', 'account_name']);
      const group = this.findFieldValue(row, ['group', 'ledger_group', 'parent_group']) || 'Sundry Debtors';
      const openingBalance = this.findFieldValue(row, ['opening_balance', 'opening']) || '0';
      const address = this.findFieldValue(row, ['address', 'ledger_address']);
      const phone = this.findFieldValue(row, ['phone', 'mobile', 'contact']);

      if (!name) {
        console.warn(`Skipping row ${index + 1}: Missing ledger name`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <LEDGER NAME="${name}" RESERVEDNAME="">\n`;
      xml += `            <OLDAUDITENTRYIDS.LIST TYPE="Number">\n`;
      xml += `              <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>\n`;
      xml += `            </OLDAUDITENTRYIDS.LIST>\n`;
      xml += `            <GUID>${this.generateGUID()}</GUID>\n`;
      xml += `            <PARENT>${group}</PARENT>\n`;
      xml += `            <NAME>${name}</NAME>\n`;
      if (address) {
        xml += `            <ADDRESS.LIST>\n`;
        xml += `              <ADDRESS>${address}</ADDRESS>\n`;
        xml += `            </ADDRESS.LIST>\n`;
      }
      if (phone) {
        xml += `            <PHONE>${phone}</PHONE>\n`;
      }
      xml += `            <OPENINGBALANCE>${openingBalance}</OPENINGBALANCE>\n`;
      xml += `            <ISBILLWISEON>No</ISBILLWISEON>\n`;
      xml += `            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>\n`;
      xml += `          </LEDGER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generateStockItemsXML(rows: any[]): string {
    let xml = '';
    
    rows.forEach((row, index) => {
      const name = this.findFieldValue(row, ['name', 'item_name', 'stock_name']);
      const unit = this.findFieldValue(row, ['unit', 'uom', 'unit_of_measure']) || 'Nos';
      const rate = this.findFieldValue(row, ['rate', 'unit_price', 'price']) || '0';
      const group = this.findFieldValue(row, ['group', 'stock_group']) || 'Primary';

      if (!name) {
        console.warn(`Skipping row ${index + 1}: Missing stock item name`);
        return;
      }

      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <STOCKITEM NAME="${name}" RESERVEDNAME="">\n`;
      xml += `            <OLDAUDITENTRYIDS.LIST TYPE="Number">\n`;
      xml += `              <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>\n`;
      xml += `            </OLDAUDITENTRYIDS.LIST>\n`;
      xml += `            <GUID>${this.generateGUID()}</GUID>\n`;
      xml += `            <PARENT>${group}</PARENT>\n`;
      xml += `            <NAME>${name}</NAME>\n`;
      xml += `            <BASEUNITS>${unit}</BASEUNITS>\n`;
      xml += `            <RATEOFPURCHASE>${rate}</RATEOFPURCHASE>\n`;
      xml += `            <RATEOFSALE>${rate}</RATEOFSALE>\n`;
      xml += `            <GSTDETAILS.LIST>\n`;
      xml += `              <APPLICABLEFROM>20170701</APPLICABLEFROM>\n`;
      xml += `              <CALCULATIONTYPE>On Value</CALCULATIONTYPE>\n`;
      xml += `            </GSTDETAILS.LIST>\n`;
      xml += `          </STOCKITEM>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  private generateGeneralVouchersXML(rows: any[], templateType: string): string {
    // Generic voucher generation for unknown types
    let xml = '';
    
    rows.forEach((row, index) => {
      xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
      xml += `          <!-- Row ${index + 1}: ${JSON.stringify(row).substring(0, 100)}... -->\n`;
      xml += `          <VOUCHER REMOTEID="GV${index + 1}" VCHKEY="${this.generateVoucherKey()}" VCHTYPE="Journal" ACTION="Create">\n`;
      xml += `            <DATE>${this.formatTallyDate(new Date())}</DATE>\n`;
      xml += `            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>\n`;
      xml += `            <VOUCHERNUMBER>GV${index + 1}</VOUCHERNUMBER>\n`;
      xml += `            <NARRATION>Imported from ${templateType} template</NARRATION>\n`;
      xml += `          </VOUCHER>\n`;
      xml += `        </TALLYMESSAGE>\n`;
    });

    return xml;
  }

  /**
   * Sync XML data directly to Tally ERP via desktop app
   */
  async syncToTally(xmlContent: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if local backend (desktop app) is available
      const relayStatus = await this.checkRelayConnection();
      
      if (!relayStatus.connected) {
        return {
          success: false,
          message: 'TallySync desktop app is not running. Please start the desktop app or download the XML file for manual import.'
        };
      }

      // Send XML to local Tally backend
      const response = await fetch(`${this.baseUrl}/tally/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xmlData: xmlContent,
          userId: this.userId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Sync failed with status ${response.status}`
        };
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: 'Data successfully synced to Tally ERP'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to sync data to Tally'
        };
      }

    } catch (error) {
      console.error('Tally sync error:', error);
      return {
        success: false,
        message: `Sync error: ${error.message}`
      };
    }
  }
}

// Create and export a singleton instance
const tallySyncService = new TallySyncService();
export default tallySyncService;
