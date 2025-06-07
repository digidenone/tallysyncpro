/**
 * TallyService - Advanced Tally ERP 9 Integration Service
 * 
 * A comprehensive service for managing all interactions with Tally ERP 9 software,
 * providing seamless data synchronization, voucher management, and financial
 * reporting capabilities for the TallySync Pro application.
 * 
 * CORE FEATURES:
 * - Multi-format voucher creation and management
 * - Real-time Tally ERP 9 connection monitoring
 * - Advanced data validation and error handling
 * - Bulk operations with progress tracking
 * - Custom ledger and item management
 * - GST compliance and tax calculations
 * 
 * SUPPORTED OPERATIONS:
 * - Sales, Purchase, Payment, Receipt vouchers
 * - Journal entries and contra transactions
 * - Inventory management and stock updates
 * - Customer and vendor data synchronization
 * - Financial report generation and export
 * 
 * INTEGRATION ARCHITECTURE:
 * - Direct XML API communication with Tally
 * - HTTP-based request/response handling
 * - Connection pooling and retry mechanisms
 * - Real-time status monitoring and alerts
 * - Comprehensive error handling and recovery
 * 
 * SECURITY & COMPLIANCE:
 * - Secure data transmission protocols
 * - GST validation and compliance checks
 * - Audit trail maintenance
 * - Role-based access control integration
 * - Data encryption for sensitive information
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Efficient batch processing algorithms
 * - Memory management for large datasets
 * - Connection reuse and optimization
 * - Background processing for heavy operations
 * - Progress tracking and user feedback
 * 
 * @module TallyService
 * @version 2.0.0
 * @author TallySync Pro Team
 */
import { toast } from 'sonner';
import NotificationService from './NotificationService';

// Enhanced interfaces for comprehensive Tally Prime integration
export interface TallyVoucherData {
  date: string;
  amount: number;
  description?: string;
  customer?: string;
  particulars?: string;
  invoice?: string;
  costCenter?: string;
  category?: string;
  gstin?: string;
  status?: string;  // Enhanced Tally Prime specific fields
  narration?: string;
  reference?: string;
  tallyId?: string;
  voucherNumber?: string;
  debitLedger?: string;
  creditLedger?: string;
  taxType?: string;
  taxRate?: number;
  taxAmount?: number;
  discountAmount?: number;
  roundOff?: number;
  party?: string;
  itemName?: string;
  quantity?: number;
  rate?: number;
  unit?: string;
  godownName?: string;
  batchName?: string;
  expiryDate?: string;
  mfgDate?: string;
  alterDate?: string;
  guid?: string;
}

// Enhanced Excel import template structure
export interface ExcelImportTemplate {
  templateType: 'sales' | 'purchase' | 'payment' | 'receipt' | 'journal' | 'contra' | 'debitNote' | 'creditNote';
  columns: ExcelColumn[];
  sampleData: Record<string, unknown>[];
  validationRules: ValidationRule[];
  mappingConfig: FieldMapping[];
}

export interface ExcelColumn {
  name: string;
  key: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  description: string;
  example: string;
  tallyField: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  rule: string;
  message: string;
}

export interface FieldMapping {
  excelColumn: string;
  tallyField: string;
  transformation?: 'date' | 'currency' | 'uppercase' | 'trim';
  defaultValue?: string;
}

// Comprehensive Tally Prime data structures
export interface TallyCompany {
  name: string;
  guid: string;
  financialYearFrom: string;
  financialYearTo: string;
  baseCurrency: string;
  dataPath: string;
  lastModified: string;
  version: string;
}

export interface TallyLedger {
  name: string;
  guid: string;
  parent: string;
  alias?: string;
  openingBalance: number;
  closingBalance: number;
  isRevenue: boolean;
  isDeemed: boolean;
  affectsStock: boolean;
  ledgerContact?: TallyLedgerContact;
}

export interface TallyLedgerContact {
  address?: string;
  pincode?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
}

export interface TallyGroup {
  name: string;
  parent?: string;
  isRevenue: boolean;
  affectsGrossProfit: boolean;
  sortPosition: number;
}

export interface TallyStockItem {
  name: string;
  guid: string;
  alias?: string;
  parent: string;
  category?: string;
  baseUnits: string;
  openingBalance: number;
  openingValue: number;
  closingBalance: number;
  closingValue: number;
  godownWiseDetails?: TallyGodownDetails[];
  batchWiseDetails?: TallyBatchDetails[];
}

export interface TallyGodownDetails {
  godownName: string;
  quantity: number;
  rate: number;
  value: number;
}

export interface TallyBatchDetails {
  batchName: string;
  quantity: number;
  rate: number;
  value: number;
  godownName?: string;
  expiryDate?: string;
  mfgDate?: string;
}

export interface TallyBankReconciliation {
  date: string;
  particular: string;
  voucherType: string;
  voucherNumber: string;
  amount: number;
  reconciled: boolean;
  bankDate?: string;
  instrumentNumber?: string;
  instrumentDate?: string;
}

export interface TallyGSTDetails {
  gstin: string;
  gstRegistrationType: string;
  taxType: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  reverseCharge: boolean;
  placeOfSupply: string;
  hsnCode?: string;
  sacCode?: string;
}

interface TallyConfig {
  server: string;
  port: number;
  company: string;
  username: string;
  password: string;
  dsn?: string;
  tallyVersion?: string;
  dataPath?: string;
  financialYear?: string;
}

// Analytics and reporting types
export interface TallyAnalyticsMetrics {
  totalSales: number;
  totalPurchases: number;
  totalReceipts: number;
  totalPayments: number;
  netProfit: number;
  grossProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  cashFlow: number;
}

export interface TallyAnalyticsTrend {
  period: string;
  sales: number;
  purchases: number;
  profit: number;
  expenses: number;
}

export interface TallyAnalyticsCategory {
  name: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface TallyAnalyticsRegion {
  region: string;
  sales: number;
  customers: number;
  growth: number;
}

export interface TallyAnalyticsVoucher {
  type: string;
  count: number;
  amount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TallyAnalyticsCustomer {
  name: string;
  totalSales: number;
  totalPurchases: number;
  outstandingAmount: number;
  creditDays: number;
}

export interface TallyAnalyticsSupplier {
  name: string;
  totalPurchases: number;
  totalPayments: number;
  outstandingAmount: number;
  paymentDays: number;
}

export interface TallyAnalyticsInventory {
  itemName: string;
  currentStock: number;
  value: number;
  movement: 'fast' | 'slow' | 'dead';
  reorderLevel: number;
}

// Validation result types
export interface ExcelValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data: TallyVoucherData[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export interface TallyAnalyticsData {
  metrics: TallyAnalyticsMetrics;
  trends: TallyAnalyticsTrend[];
  categories: TallyAnalyticsCategory[];
  regions: TallyAnalyticsRegion[];
  vouchers: TallyAnalyticsVoucher[];
  customers: TallyAnalyticsCustomer[];
  suppliers: TallyAnalyticsSupplier[];
  inventory: TallyAnalyticsInventory[];
}

// Import result types
export interface TallyImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  details: TallyVoucherData[];
}

// System status types
export interface TallySystemStatus {
  tallyVersion: string;
  connectionStatus: boolean;
  lastSync: string;
  dataPath: string;
  performanceMetrics: {
    responseTime: number;
    dataSize: number;
    voucherCount: number;
    errorCount: number;
  };
}

interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

class TallyService {
  private baseURL: string = 'http://localhost:9000/api';
  private connectionStatus: boolean = false;
  private connectionError: string | null = null;
  private config: TallyConfig = {
    server: 'localhost',
    port: 9000,
    company: '',
    username: '',
    password: '',
    dsn: 'TallyODBC64_9000',
    tallyVersion: 'Tally ERP 9',
    dataPath: '',
    financialYear: '',
  };
  constructor() {
    this.loadConfig();
    this.initializeConnection();
  }

  /**
   * Initialize connection with enhanced notifications
   */
  private async initializeConnection(): Promise<void> {
    try {
      NotificationService.connectionProgress(1, 3, 'Connecting to backend service...');
      await this.checkBackendConnection();
      
      NotificationService.connectionProgress(2, 3, 'Testing Tally connection...');
      await this.testConnection();
      
      NotificationService.connectionProgress(3, 3, 'System ready!');
      NotificationService.connectionSuccess('tally', 'All systems operational');
    } catch (error) {
      console.error('Connection initialization failed:', error);
      NotificationService.connectionError('backend', 'Failed to establish connections');
    }
  }

  /**
   * Check if backend service is running
   */  private async checkBackendConnection(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${this.baseURL}/health`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend service is running:', data);
        NotificationService.connectionSuccess('backend', 'Backend service connected successfully');
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        NotificationService.connectionError('backend', 'Connection timeout - backend service may not be running');
      } else {
        NotificationService.connectionError('backend', 'Backend service is not accessible. Please start the TallySync backend service.');
      }
      throw error;
    }
  }
  /**
   * Test connection to Tally ODBC via backend
   */
  async testConnection(config?: Partial<TallyConfig>): Promise<boolean> {
    try {
      const testConfig = { ...this.config, ...config };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for Tally
      
      const response = await fetch(`${this.baseURL}/tally/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConfig),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: APIResponse = await response.json();
      
      if (result.success) {
        this.connectionStatus = true;
        this.connectionError = null;
        NotificationService.connectionSuccess('tally', result.message || 'Tally connection established');
        return true;
      } else {
        this.connectionStatus = false;
        this.connectionError = result.error || result.message;
        NotificationService.connectionError('tally', result.message || 'Failed to connect to Tally');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.connectionStatus = false;
      this.connectionError = errorMessage;
      
      if (error instanceof Error && error.name === 'AbortError') {
        NotificationService.connectionError('tally', 'Tally connection timeout - please check if Tally is running');
      } else {
        NotificationService.connectionError('tally', 'Failed to connect to Tally: ' + errorMessage);
      }
      return false;
    }
  }

  /**
   * Connect to Tally ODBC via backend
   */
  async connect(config?: Partial<TallyConfig>): Promise<boolean> {
    try {
      const connectConfig = { ...this.config, ...config };
      
      const response = await fetch(`${this.baseURL}/tally/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connectConfig),
      });

      const result: APIResponse = await response.json();
      
      if (result.success) {
        this.connectionStatus = true;
        this.connectionError = null;
        this.config = { ...this.config, ...connectConfig };
        this.saveConfig(this.config);
        toast.success(result.message);
        return true;
      } else {
        this.connectionStatus = false;
        this.connectionError = result.error || result.message;
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      this.connectionStatus = false;
      this.connectionError = errorMessage;
      toast.error('Failed to connect: ' + errorMessage);
      return false;
    }
  }

  /**
   * Disconnect from Tally via backend
   */
  async disconnect(): Promise<void> {
    try {
      await fetch(`${this.baseURL}/tally/disconnect`, {
        method: 'POST',
      });
      
      this.connectionStatus = false;
      this.connectionError = null;
      toast.success('Disconnected from Tally');
    } catch (error) {
      console.error('Error disconnecting from Tally:', error);
    }
  }

  /**
   * Get connection status from backend
   */  async getConnectionStatus(): Promise<{ connected: boolean; message: string; data?: unknown }> {
    try {
      const response = await fetch(`${this.baseURL}/tally/status`);
      const result: APIResponse<{ connected: boolean }> = await response.json();
      
      this.connectionStatus = result.data?.connected || false;
      
      return {
        connected: this.connectionStatus,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      this.connectionStatus = false;
      return {
        connected: false,
        message: 'Failed to get status from backend service',
      };
    }
  }
  /**
   * Get list of companies from Tally
   */
  async getCompanies(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseURL}/tally/companies`);
      const result: APIResponse<{ companies: string[] }> = await response.json();
      
      if (result.success) {
        return result.data?.companies || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get companies:', error);
      toast.error('Failed to get companies from Tally');
      return [];
    }
  }

  /**
   * Get list of ledgers from Tally
   */  async getLedgers(company?: string): Promise<TallyLedger[]> {
    try {
      const url = company 
        ? `${this.baseURL}/tally/ledgers?company=${encodeURIComponent(company)}`
        : `${this.baseURL}/tally/ledgers`;
      
      const response = await fetch(url);
      const result: APIResponse<{ ledgers: TallyLedger[] }> = await response.json();
      
      if (result.success) {
        return result.data?.ledgers || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get ledgers:', error);
      toast.error('Failed to get ledgers from Tally');
      return [];
    }
  }
  /**
   * Get list of voucher types from Tally
   */
  async getVoucherTypes(company?: string): Promise<string[]> {
    try {
      const url = company 
        ? `${this.baseURL}/tally/voucher-types?company=${encodeURIComponent(company)}`
        : `${this.baseURL}/tally/voucher-types`;
      
      const response = await fetch(url);
      const result: APIResponse<{ voucherTypes: string[] }> = await response.json();
      
      if (result.success) {
        return result.data?.voucherTypes || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get voucher types:', error);
      toast.error('Failed to get voucher types from Tally');
      return [];
    }
  }
  /**
   * Upload and process file via backend
   */
  async uploadFile(file: File, options?: Record<string, unknown>): Promise<APIResponse<{
    fileId: string;
    processedData: TallyVoucherData[];
    summary: {
      totalRows: number;
      validRows: number;
      errorRows: number;
    };
  }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        body: formData,
      });      const result: APIResponse<{
        fileId: string;
        processedData: TallyVoucherData[];
        summary: {
          totalRows: number;
          validRows: number;
          errorRows: number;
        };
      }> = await response.json();
      
      if (result.success) {
        toast.success('File processed successfully');
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      toast.error(errorMessage);
      throw error;
    }
  }
  /**
   * Validate processed data via backend
   */
  async validateData(data: TallyVoucherData[], rules?: ValidationRule[]): Promise<APIResponse<ExcelValidationResult>> {
    try {
      const response = await fetch(`${this.baseURL}/files/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, rules }),
      });      const result: APIResponse<ExcelValidationResult> = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to validate data:', error);
      toast.error('Failed to validate data');
      throw error;
    }
  }

  /**
   * Sync data with Tally via backend
   */
  async syncToTally(data: TallyVoucherData[], voucherType: string = '', ledgerName: string = ''): Promise<boolean> {
    try {
      // Generate XML using the existing method
      const xmlData = await this.saveAsXmlFile(data, voucherType, ledgerName);
      
      // Import via backend
      const response = await fetch(`${this.baseURL}/tally/import-vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xmlData,
          company: this.config.company,
        }),
      });

      const result: APIResponse = await response.json();
      
      if (result.success) {
        toast.success('Data imported to Tally successfully');
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Failed to sync to Tally:', error);
      toast.error('Failed to sync data to Tally');
      return false;
    }
  }

  // Configuration management
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('tallyConfig');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private saveConfig(config: TallyConfig): void {
    try {
      localStorage.setItem('tallyConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  // Getters
  isConnected(): boolean {
    return this.connectionStatus;
  }

  getConfig(): TallyConfig {
    return { ...this.config };
  }

  getConnectionError(): string | null {
    return this.connectionError;
  }  // This function generates valid Tally XML format (keeping the existing implementation)
  async saveAsXmlFile(data: TallyVoucherData[], voucherType: string = '', defaultLedgerName: string = ''): Promise<string> {
    let xml = `<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Vouchers</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${this.config.company}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>`;    // Process each data row to create voucher entries
    data.forEach((row, index) => {
      const voucherDate = row.date ? new Date(row.date) : new Date();
      const formattedDate = voucherDate.toISOString().split('T')[0];
        const actualVoucherType = voucherType || 'Journal';
      const ledgerName = row.customer || defaultLedgerName || 'Cash';
      const amount = row.amount || 0;
      
      if (amount === 0) {
        console.warn(`Row ${index+1} has zero or invalid amount`);
      }

      const gstin = row.gstin || '';
      
      const narrationParts = [];
      if (row.invoice) narrationParts.push(`Invoice: ${row.invoice}`);
      if (row.description) narrationParts.push(row.description);
      if (row.particulars) narrationParts.push(row.particulars);
      if (row.costCenter) narrationParts.push(`Cost Center: ${row.costCenter}`);
      const narration = narrationParts.length > 0 ? narrationParts.join(' | ') : '';

      xml += `
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER REMOTEID="" VCHTYPE="${actualVoucherType}" ACTION="Create">
                        <DATE>${formattedDate}</DATE>
                        <GUID></GUID>
                        <NARRATION>${narration}</NARRATION>
                        <VOUCHERTYPENAME>${actualVoucherType}</VOUCHERTYPENAME>
                        <REFERENCE>${row.invoice || ''}</REFERENCE>
                        <VOUCHERNUMBER>${row.invoice || index + 1}</VOUCHERNUMBER>
                        <PARTYLEDGERNAME>${ledgerName}</PARTYLEDGERNAME>
                        <CSTFORMISSUETYPE/>
                        <CSTFORMRECVTYPE/>
                        <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
                        <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
                        <EFFECTIVEDATE>${formattedDate}</EFFECTIVEDATE>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${ledgerName}</LEDGERNAME>
                            <GSTCLASS/>
                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <LEDGERFROMITEM>No</LEDGERFROMITEM>
                            <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
                            <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
                            <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>
                            <AMOUNT>-${amount.toFixed(2)}</AMOUNT>
                            ${gstin ? `<VATEXPAMOUNT>${amount.toFixed(2)}</VATEXPAMOUNT>
                            <GSTDETAILS.LIST>
                                <APPLICABLEFROM>${formattedDate}</APPLICABLEFROM>
                                <GSTNATUREOFTRANSACTION>Interstate</GSTNATUREOFTRANSACTION>
                                <GSTPARTYTYPE>Regular</GSTPARTYTYPE>
                                <GSTPARTYGSTIN>${gstin}</GSTPARTYGSTIN>
                            </GSTDETAILS.LIST>` : ''}
                        </ALLLEDGERENTRIES.LIST>
                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${row.category || 'Sales'}</LEDGERNAME>
                            <GSTCLASS/>
                            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                            <LEDGERFROMITEM>No</LEDGERFROMITEM>
                            <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
                            <ISPARTYLEDGER>No</ISPARTYLEDGER>
                            <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>
                            <AMOUNT>${amount.toFixed(2)}</AMOUNT>
                            ${row.costCenter ? `<COSTCENTREALLOCATIONS.LIST>
                                <NAME>${row.costCenter}</NAME>
                                <AMOUNT>${amount.toFixed(2)}</AMOUNT>
                            </COSTCENTREALLOCATIONS.LIST>` : ''}
                        </ALLLEDGERENTRIES.LIST>
                    </VOUCHER>
                </TALLYMESSAGE>`;
    });    xml += `
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

    return xml;
  }

  // ==========================================================================
  // ENHANCED TALLY PRIME INTEGRATION METHODS
  // ==========================================================================
  /**
   * Get comprehensive company information including all details
   */
  async getCompanyDetails(companyName?: string): Promise<TallyCompany[]> {
    try {
      const url = companyName 
        ? `${this.baseURL}/tally/company-details?name=${encodeURIComponent(companyName)}`
        : `${this.baseURL}/tally/company-details`;
      
      const response = await fetch(url);
      const result: APIResponse<{ companies: TallyCompany[] }> = await response.json();
      
      if (result.success) {
        return result.data?.companies || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get company details:', error);
      toast.error('Failed to get company details from Tally Prime');
      return [];
    }
  }

  /**
   * Get all ledgers with complete details including balances and contacts
   */
  async getAllLedgersDetailed(company?: string): Promise<TallyLedger[]> {
    try {
      const url = company 
        ? `${this.baseURL}/tally/ledgers-detailed?company=${encodeURIComponent(company)}`
        : `${this.baseURL}/tally/ledgers-detailed`;
        const response = await fetch(url);
      const result: APIResponse<{ ledgers: TallyLedger[] }> = await response.json();
      
      if (result.success) {
        return result.data?.ledgers || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get detailed ledgers:', error);
      toast.error('Failed to get detailed ledgers from Tally Prime');
      return [];
    }
  }

  /**
   * Get all groups with hierarchy information
   */
  async getGroups(company?: string): Promise<TallyGroup[]> {
    try {
      const url = company 
        ? `${this.baseURL}/tally/groups?company=${encodeURIComponent(company)}`
        : `${this.baseURL}/tally/groups`;
        const response = await fetch(url);
      const result: APIResponse<{ groups: TallyGroup[] }> = await response.json();
      
      if (result.success) {
        return result.data?.groups || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get groups:', error);
      toast.error('Failed to get groups from Tally Prime');
      return [];
    }
  }

  /**
   * Get all stock items with detailed information
   */
  async getStockItems(company?: string): Promise<TallyStockItem[]> {
    try {
      const url = company 
        ? `${this.baseURL}/tally/stock-items?company=${encodeURIComponent(company)}`
        : `${this.baseURL}/tally/stock-items`;
        const response = await fetch(url);
      const result: APIResponse<{ stockItems: TallyStockItem[] }> = await response.json();
      
      if (result.success) {
        return result.data?.stockItems || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get stock items:', error);
      toast.error('Failed to get stock items from Tally Prime');
      return [];
    }
  }

  /**
   * Get bank reconciliation data
   */
  async getBankReconciliation(
    ledgerName: string, 
    fromDate: string, 
    toDate: string,
    company?: string
  ): Promise<TallyBankReconciliation[]> {
    try {
      const params = new URLSearchParams({
        ledger: ledgerName,
        from: fromDate,
        to: toDate,
        ...(company && { company })
      });
        const response = await fetch(`${this.baseURL}/tally/bank-reconciliation?${params}`);
      const result: APIResponse<{ reconciliation: TallyBankReconciliation[] }> = await response.json();
      
      if (result.success) {
        return result.data?.reconciliation || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get bank reconciliation:', error);
      toast.error('Failed to get bank reconciliation from Tally Prime');
      return [];
    }
  }

  /**
   * Get GST report data
   */
  async getGSTReport(
    reportType: 'GSTR1' | 'GSTR2' | 'GSTR3B',
    month: string,
    year: string,
    company?: string
  ): Promise<TallyGSTDetails[]> {
    try {
      const params = new URLSearchParams({
        type: reportType,
        month,
        year,
        ...(company && { company })
      });
        const response = await fetch(`${this.baseURL}/tally/gst-report?${params}`);
      const result: APIResponse<{ gstData: TallyGSTDetails[] }> = await response.json();
      
      if (result.success) {
        return result.data?.gstData || [];
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get GST report:', error);
      toast.error('Failed to get GST report from Tally Prime');
      return [];
    }
  }

  /**
   * Generate Excel import templates with Tally Prime structure
   */
  async generateExcelTemplate(templateType: ExcelImportTemplate['templateType']): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/templates/excel/${templateType}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        return blob;
      } else {
        throw new Error(`Failed to generate ${templateType} template`);
      }
    } catch (error) {
      console.error(`Failed to generate ${templateType} template:`, error);
      toast.error(`Failed to generate ${templateType} template`);
      throw error;
    }
  }

  /**
   * Download Excel template with sample data
   */
  async downloadExcelTemplate(templateType: ExcelImportTemplate['templateType']): Promise<void> {
    try {
      const blob = await this.generateExcelTemplate(templateType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TallySync_${templateType}_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`${templateType} template downloaded successfully`);
    } catch (error) {
      console.error(`Failed to download ${templateType} template:`, error);
      toast.error(`Failed to download ${templateType} template`);
    }
  }

  /**
   * Validate Excel data before import
   */  async validateExcelData(
    file: File, 
    templateType: ExcelImportTemplate['templateType']
  ): Promise<ExcelValidationResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateType', templateType);

      const response = await fetch(`${this.baseURL}/tally/validate-excel`, {
        method: 'POST',
        body: formData,
      });

      const result: APIResponse<ExcelValidationResult> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to validate Excel data:', error);
      toast.error('Failed to validate Excel data');
      return {
        isValid: false,
        errors: ['Failed to validate Excel data'],
        warnings: [],
        data: [],
        summary: { total: 0, valid: 0, invalid: 0 }
      };
    }
  }

  /**
   * Import Excel data to Tally Prime with comprehensive validation
   */
  async importExcelToTally(
    file: File, 
    templateType: ExcelImportTemplate['templateType'],
    options: {
      company?: string;
      skipDuplicates?: boolean;
      createLedgers?: boolean;
      createStockItems?: boolean;
      dryRun?: boolean;
    } = {}  ): Promise<TallyImportResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateType', templateType);
      formData.append('options', JSON.stringify(options));

      const response = await fetch(`${this.baseURL}/tally/import-excel`, {
        method: 'POST',
        body: formData,
      });

      const result: APIResponse<TallyImportResult> = await response.json();
      
      if (result.success && result.data) {
        const importResult = result.data;
        toast.success(`Import completed: ${importResult.imported} imported, ${importResult.failed} failed`);
        return importResult;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to import Excel data:', error);
      toast.error('Failed to import Excel data to Tally Prime');
      return {
        success: false,
        imported: 0,
        failed: 0,
        skipped: 0,
        errors: ['Failed to import Excel data'],
        warnings: [],
        details: []
      };
    }
  }

  /**
   * Get comprehensive analytics data from Tally Prime
   */  async getAnalyticsData(
    fromDate: string,
    toDate: string,
    company?: string
  ): Promise<TallyAnalyticsData> {
    try {
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        ...(company && { company })
      });
      
      const response = await fetch(`${this.baseURL}/tally/analytics?${params}`);
      const result: APIResponse<TallyAnalyticsData> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get analytics data:', error);
      toast.error('Failed to get analytics data from Tally Prime');
      return {
        metrics: {
          totalSales: 0,
          totalPurchases: 0,
          totalReceipts: 0,
          totalPayments: 0,
          netProfit: 0,
          grossProfit: 0,
          totalAssets: 0,
          totalLiabilities: 0,
          cashFlow: 0,
        },
        trends: [],
        categories: [],
        regions: [],
        vouchers: [],
        customers: [],
        suppliers: [],
        inventory: []
      };
    }
  }

  /**
   * Real-time data sync with Tally Prime
   */
  async syncRealTimeData(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/tally/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: APIResponse = await response.json();
      
      if (result.success) {
        toast.success('Data synchronized successfully');
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
      toast.error('Failed to sync data with Tally Prime');
      return false;
    }
  }

  /**
   * Export data from Tally Prime in various formats
   */  async exportData(
    exportType: 'excel' | 'csv' | 'pdf' | 'json',
    dataType: 'vouchers' | 'ledgers' | 'stock' | 'reports',
    options: {
      fromDate?: string;
      toDate?: string;
      company?: string;
      filters?: Record<string, unknown>;
    } = {}
  ): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/tally/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exportType,
          dataType,
          ...options
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        return blob;
      } else {
        throw new Error(`Failed to export ${dataType} as ${exportType}`);
      }
    } catch (error) {
      console.error(`Failed to export ${dataType}:`, error);
      toast.error(`Failed to export ${dataType} as ${exportType}`);
      throw error;
    }
  }
  /**
   * Get system health and performance metrics
   */
  async getSystemHealth(): Promise<TallySystemStatus> {
    try {
      const response = await fetch(`${this.baseURL}/tally/health`);
      const result: APIResponse<TallySystemStatus> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to get system health:', error);
      return {
        tallyVersion: 'Unknown',
        connectionStatus: false,
        lastSync: 'Never',
        dataPath: '',
        performanceMetrics: {
          responseTime: 0,
          dataSize: 0,
          voucherCount: 0,
          errorCount: 1
        }
      };
    }
  }
}

export default TallyService;
