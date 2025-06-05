/**
 * Automated Tally ERP 9 Integration Service
 * 
 * This service provides seamless, automated integration with Tally ERP 9:
 * - Auto-detection of running Tally instances
 * - Automatic XML generation and import
 * - Real-time synchronization
 * - Background monitoring and connection management
 */

import realTimeDataService from './RealTimeDataService';

export interface TallyConnection {
  host: string;
  port: number;
  company?: string;
  isConnected: boolean;
  version?: string;
  licenseName?: string;
}

export interface AutoSyncConfig {
  autoDetectTally: boolean;
  autoImportOnUpload: boolean;
  backgroundSync: boolean;
  syncInterval: number; // in seconds
  retryAttempts: number;
  enableNotifications: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  importedToTally: boolean;
  tallyResponse?: any;
  errors?: string[];
}

class AutomatedTallyService {
  private connections: TallyConnection[] = [];
  private activeConnection: TallyConnection | null = null;
  private syncConfig: AutoSyncConfig;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private syncQueue: Array<{ file: File; data: any; resolve: Function; reject: Function }> = [];
  private isSyncing = false;

  constructor() {
    this.syncConfig = this.loadSyncConfig();
    this.startMonitoring();
  }

  // Configuration Management
  private loadSyncConfig(): AutoSyncConfig {
    const stored = localStorage.getItem('tallysync_auto_config');
    return stored ? JSON.parse(stored) : {
      autoDetectTally: true,
      autoImportOnUpload: true,
      backgroundSync: true,
      syncInterval: 30,
      retryAttempts: 3,
      enableNotifications: true
    };
  }

  updateSyncConfig(config: Partial<AutoSyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    localStorage.setItem('tallysync_auto_config', JSON.stringify(this.syncConfig));
    
    if (config.backgroundSync !== undefined) {
      if (config.backgroundSync) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }
  }

  getSyncConfig(): AutoSyncConfig {
    return { ...this.syncConfig };
  }

  // Tally Detection and Connection
  async detectTallyInstances(): Promise<TallyConnection[]> {
    const detectedConnections: TallyConnection[] = [];
    
    // Common Tally ERP 9 ports and configurations
    const tallyPorts = [9000, 9001, 9002, 9003, 9004, 9005];
    const hosts = ['localhost', '127.0.0.1'];

    for (const host of hosts) {
      for (const port of tallyPorts) {
        try {
          const isRunning = await this.testTallyConnection(host, port);
          if (isRunning) {
            const connection: TallyConnection = {
              host,
              port,
              isConnected: true,
              version: await this.getTallyVersion(host, port),
              company: await this.getCurrentCompany(host, port)
            };
            detectedConnections.push(connection);
          }
        } catch (error) {
          // Connection failed, continue to next port
        }
      }
    }

    this.connections = detectedConnections;
    if (detectedConnections.length > 0 && !this.activeConnection) {
      this.activeConnection = detectedConnections[0];
      realTimeDataService.updateConnectionStatus(true);
    }

    return detectedConnections;
  }

  private async testTallyConnection(host: string, port: number): Promise<boolean> {
    try {
      // Send a simple request to Tally to check if it's running
      const response = await fetch(`http://${host}:${port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml'
        },
        body: `<ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>List of Companies</REPORTNAME>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>`,
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async getTallyVersion(host: string, port: number): Promise<string> {
    try {
      const response = await fetch(`http://${host}:${port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: `<ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>List of Companies</REPORTNAME>
                <STATICVARIABLES>
                  <SVEXPORTFORMAT>$$SysName:TallyVersion</SVEXPORTFORMAT>
                </STATICVARIABLES>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>`
      });

      if (response.ok) {
        const text = await response.text();
        // Parse version from response
        return this.extractVersionFromResponse(text);
      }
    } catch (error) {
      console.warn('Could not get Tally version:', error);
    }
    return 'Unknown';
  }

  private async getCurrentCompany(host: string, port: number): Promise<string> {
    try {
      const response = await fetch(`http://${host}:${port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: `<ENVELOPE>
          <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
          </HEADER>
          <BODY>
            <EXPORTDATA>
              <REQUESTDESC>
                <REPORTNAME>List of Companies</REPORTNAME>
                <STATICVARIABLES>
                  <SVEXPORTFORMAT>$$FilteredCompany</SVEXPORTFORMAT>
                </STATICVARIABLES>
              </REQUESTDESC>
            </EXPORTDATA>
          </BODY>
        </ENVELOPE>`
      });

      if (response.ok) {
        const text = await response.text();
        return this.extractCompanyFromResponse(text);
      }
    } catch (error) {
      console.warn('Could not get current company:', error);
    }
    return 'Unknown';
  }

  // Background Monitoring
  startMonitoring(): void {
    if (this.isMonitoring || !this.syncConfig.backgroundSync) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.detectTallyInstances();
      await this.processSyncQueue();
    }, this.syncConfig.syncInterval * 1000);

    console.log('Tally monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Tally monitoring stopped');
  }

  // Automated Excel to Tally Sync
  async autoSyncExcelFile(file: File): Promise<SyncResult> {
    const operationId = realTimeDataService.startSyncOperation('sync', file.name);

    try {
      // Step 1: Process Excel file
      const excelData = await this.processExcelFile(file);
      if (!excelData.success) {
        throw new Error(excelData.message);
      }      // Step 2: Convert to Tally XML
      const xmlData = await this.generateTallyXML(excelData.data);
      if (!xmlData.success || !xmlData.xml) {
        throw new Error(xmlData.message || 'Failed to generate XML data');
      }

      // Step 3: Auto-detect Tally if needed
      if (!this.activeConnection && this.syncConfig.autoDetectTally) {
        await this.detectTallyInstances();
      }

      if (!this.activeConnection) {
        throw new Error('No active Tally connection. Please ensure Tally ERP 9 is running.');
      }

      // Step 4: Import to Tally automatically
      const importResult = await this.importToTally(xmlData.xml);
      
      realTimeDataService.completeSyncOperation(
        operationId,
        importResult.success,
        importResult.recordsProcessed,
        importResult.message
      );

      return importResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      realTimeDataService.completeSyncOperation(operationId, false, 0, errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        recordsProcessed: 0,
        importedToTally: false,
        errors: [errorMessage]
      };
    }
  }

  private async processExcelFile(file: File): Promise<{ success: boolean; data?: any; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = (window as any).XLSX.read(data, { type: 'array' });
          
          // Process the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = (window as any).XLSX.utils.sheet_to_json(worksheet);

          resolve({
            success: true,
            data: {
              sheetName,
              records: jsonData,
              totalRecords: jsonData.length
            },
            message: `Successfully processed ${jsonData.length} records from Excel file`
          });
        } catch (error) {
          resolve({
            success: false,
            message: `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read Excel file'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private async generateTallyXML(data: any): Promise<{ success: boolean; xml?: string; message: string }> {
    try {
      // Auto-detect data type based on column headers
      const dataType = this.detectDataType(data.records);
      
      let xml = '';
      switch (dataType) {
        case 'ledgers':
          xml = this.generateLedgerXML(data.records);
          break;
        case 'vouchers':
          xml = this.generateVoucherXML(data.records);
          break;
        case 'items':
          xml = this.generateItemXML(data.records);
          break;
        default:
          xml = this.generateGenericXML(data.records);
      }

      return {
        success: true,
        xml,
        message: `Generated Tally XML for ${dataType} with ${data.records.length} records`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate Tally XML: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private detectDataType(records: any[]): string {
    if (records.length === 0) return 'generic';

    const firstRecord = records[0];
    const headers = Object.keys(firstRecord).map(key => key.toLowerCase());

    // Check for ledger indicators
    if (headers.includes('ledger') || headers.includes('account') || headers.includes('group')) {
      return 'ledgers';
    }

    // Check for voucher indicators
    if (headers.includes('voucher') || headers.includes('invoice') || headers.includes('amount')) {
      return 'vouchers';
    }

    // Check for item indicators
    if (headers.includes('item') || headers.includes('stock') || headers.includes('quantity')) {
      return 'items';
    }

    return 'generic';
  }

  private generateLedgerXML(records: any[]): string {
    const ledgerEntries = records.map(record => `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <LEDGER NAME="${this.escapeXML(record.Name || record.LedgerName || record.name)}" RESERVEDNAME="">
          <OLDAUDITENTRYIDS.LIST TYPE="Number">
            <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
          </OLDAUDITENTRYIDS.LIST>
          <GUID></GUID>
          <PARENT>${this.escapeXML(record.Group || record.Parent || 'Sundry Debtors')}</PARENT>
          <LANGUAGENAME.LIST>
            <NAME.LIST TYPE="String">
              <NAME>${this.escapeXML(record.Name || record.LedgerName || record.name)}</NAME>
            </NAME.LIST>
            <LANGUAGEID>1033</LANGUAGEID>
          </LANGUAGENAME.LIST>
          <OPENINGBALANCE>${record.OpeningBalance || record.Balance || 0}</OPENINGBALANCE>
          <ISBILLWISEON>${record.IsBillwise || 'No'}</ISBILLWISEON>
          <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
        </LEDGER>
      </TALLYMESSAGE>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>All Masters</REPORTNAME>
            <STATICVARIABLES>
              <SVCURRENTCOMPANY>$$CurrentCompany</SVCURRENTCOMPANY>
            </STATICVARIABLES>
          </REQUESTDESC>
          <REQUESTDATA>
            ${ledgerEntries}
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;
  }

  private generateVoucherXML(records: any[]): string {
    const voucherEntries = records.map(record => `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <VOUCHER REMOTEID="" VCHKEY="" VCHTYPE="${record.VoucherType || 'Sales'}" ACTION="Create" OBJVIEW="Invoice Voucher View">
          <OLDAUDITENTRYIDS.LIST TYPE="Number">
            <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
          </OLDAUDITENTRYIDS.LIST>
          <DATE>${this.formatDate(record.Date || new Date())}</DATE>
          <VOUCHERTYPENAME>${record.VoucherType || 'Sales'}</VOUCHERTYPENAME>
          <VOUCHERNUMBER>${record.VoucherNumber || record.InvoiceNo || ''}</VOUCHERNUMBER>
          <PARTYLEDGERNAME>${this.escapeXML(record.PartyName || record.Customer || '')}</PARTYLEDGERNAME>
          <BASICBASEPARTYNAME>${this.escapeXML(record.PartyName || record.Customer || '')}</BASICBASEPARTYNAME>
          <CSTFORMISSUETYPE/>
          <CSTFORMRECVTYPE/>
          <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
          <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
          <ALLLEDGERENTRIES.LIST>
            <OLDAUDITENTRYIDS.LIST TYPE="Number">
              <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
            </OLDAUDITENTRYIDS.LIST>
            <LEDGERNAME>${this.escapeXML(record.PartyName || record.Customer || '')}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>${record.Amount || 0}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <OLDAUDITENTRYIDS.LIST TYPE="Number">
              <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
            </OLDAUDITENTRYIDS.LIST>
            <LEDGERNAME>Sales</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>-${record.Amount || 0}</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>Vouchers</REPORTNAME>
            <STATICVARIABLES>
              <SVCURRENTCOMPANY>$$CurrentCompany</SVCURRENTCOMPANY>
            </STATICVARIABLES>
          </REQUESTDESC>
          <REQUESTDATA>
            ${voucherEntries}
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;
  }

  private generateItemXML(records: any[]): string {
    const itemEntries = records.map(record => `
      <TALLYMESSAGE xmlns:UDF="TallyUDF">
        <STOCKITEM NAME="${this.escapeXML(record.Name || record.ItemName || record.name)}" RESERVEDNAME="">
          <OLDAUDITENTRYIDS.LIST TYPE="Number">
            <OLDAUDITENTRYIDS>-1</OLDAUDITENTRYIDS>
          </OLDAUDITENTRYIDS.LIST>
          <GUID></GUID>
          <PARENT>${this.escapeXML(record.Category || record.Group || 'Primary')}</PARENT>
          <CATEGORY>${this.escapeXML(record.Category || 'Primary')}</CATEGORY>
          <TAXCLASSIFICATIONNAME/>
          <TAXTYPE>Others</TAXTYPE>
          <LANGUAGENAME.LIST>
            <NAME.LIST TYPE="String">
              <NAME>${this.escapeXML(record.Name || record.ItemName || record.name)}</NAME>
            </NAME.LIST>
            <LANGUAGEID>1033</LANGUAGEID>
          </LANGUAGENAME.LIST>
          <BASEUNITS>${record.Unit || 'Nos'}</BASEUNITS>
          <OPENINGBALANCE>${record.OpeningStock || 0}</OPENINGBALANCE>
          <OPENINGVALUE>${record.OpeningValue || 0}</OPENINGVALUE>
          <OPENINGRATE>${record.Rate || 0}</OPENINGRATE>
        </STOCKITEM>
      </TALLYMESSAGE>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <IMPORTDATA>
          <REQUESTDESC>
            <REPORTNAME>All Masters</REPORTNAME>
            <STATICVARIABLES>
              <SVCURRENTCOMPANY>$$CurrentCompany</SVCURRENTCOMPANY>
            </STATICVARIABLES>
          </REQUESTDESC>
          <REQUESTDATA>
            ${itemEntries}
          </REQUESTDATA>
        </IMPORTDATA>
      </BODY>
    </ENVELOPE>`;
  }

  private generateGenericXML(records: any[]): string {
    // Fallback generic XML generation
    return this.generateLedgerXML(records);
  }

  private async importToTally(xml: string): Promise<SyncResult> {
    if (!this.activeConnection) {
      return {
        success: false,
        message: 'No active Tally connection',
        recordsProcessed: 0,
        importedToTally: false
      };
    }

    try {
      const response = await fetch(`http://${this.activeConnection.host}:${this.activeConnection.port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Accept': 'application/xml'
        },
        body: xml
      });

      if (response.ok) {
        const responseText = await response.text();
        const recordsProcessed = this.extractRecordCount(xml);
        
        return {
          success: true,
          message: 'Data successfully imported to Tally ERP 9',
          recordsProcessed,
          importedToTally: true,
          tallyResponse: responseText
        };
      } else {
        return {
          success: false,
          message: `Tally import failed: ${response.statusText}`,
          recordsProcessed: 0,
          importedToTally: false
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recordsProcessed: 0,
        importedToTally: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Utility Methods
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0].replace(/-/g, '');
  }

  private extractVersionFromResponse(response: string): string {
    // Parse Tally version from XML response
    const match = response.match(/<VERSION>(.*?)<\/VERSION>/);
    return match ? match[1] : 'ERP 9';
  }

  private extractCompanyFromResponse(response: string): string {
    // Parse company name from XML response
    const match = response.match(/<COMPANYNAME>(.*?)<\/COMPANYNAME>/);
    return match ? match[1] : 'Unknown Company';
  }

  private extractRecordCount(xml: string): number {
    // Count TALLYMESSAGE elements in XML
    const matches = xml.match(/<TALLYMESSAGE/g);
    return matches ? matches.length : 0;
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;
    const item = this.syncQueue.shift();
    
    if (item) {
      try {
        const result = await this.autoSyncExcelFile(item.file);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isSyncing = false;
  }

  // Public API
  getActiveConnection(): TallyConnection | null {
    return this.activeConnection;
  }

  getConnections(): TallyConnection[] {
    return [...this.connections];
  }

  async setActiveConnection(connection: TallyConnection): Promise<boolean> {
    try {
      const isConnected = await this.testTallyConnection(connection.host, connection.port);
      if (isConnected) {
        this.activeConnection = connection;
        realTimeDataService.updateConnectionStatus(true);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  isConnected(): boolean {
    return this.activeConnection !== null && this.activeConnection.isConnected;
  }

  // Queue management for background sync
  queueFileForSync(file: File, data: any): Promise<SyncResult> {
    return new Promise((resolve, reject) => {
      this.syncQueue.push({ file, data, resolve, reject });
    });
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    this.connections = [];
    this.activeConnection = null;
    this.syncQueue = [];
  }
}

// Export singleton instance
export const automatedTallyService = new AutomatedTallyService();
export default automatedTallyService;
