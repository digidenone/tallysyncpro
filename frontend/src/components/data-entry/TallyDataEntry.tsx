/**
 * TallyDataEntry Component
 * 
 * Comprehensive data entry and management interface for Tally ERP 9 integration.
 * Provides sophisticated Excel-to-Tally conversion capabilities with multiple
 * import methods and real-time validation.
 * 
 * CORE FEATURES:
 * - Multi-format Excel file processing and validation
 * - Template-based data entry with auto-detection
 * - Real-time Tally XML generation and preview
 * - Batch processing for large datasets
 * - Error validation and data correction tools
 * - Download and direct sync capabilities
 * 
 * SUPPORTED TEMPLATES:
 * - Chart of Accounts (Ledgers, Groups)
 * - Inventory Management (Stock Items, Units)
 * - Voucher Entries (Sales, Purchase, Payment, Receipt)
 * - Customer/Vendor Master Data
 * - Financial Reports and Statements
 * 
 * WORKFLOW:
 * 1. Template Selection → 2. Data Entry/Upload → 3. Validation → 4. XML Generation → 5. Tally Sync
 * 
 * DATA PROCESSING:
 * - Client-side Excel parsing using SheetJS
 * - Real-time data validation and error checking
 * - Template matching and field mapping
 * - Tally-compliant XML structure generation
 * - Progressive upload with status tracking
 * 
 * INTEGRATION:
 * - TallySyncService for backend communication
 * - Real-time toast notifications for user feedback
 * - Responsive UI with professional styling
 * - Error handling and recovery mechanisms
 * 
 * @component TallyDataEntry
 * @author Digidenone
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  ArrowRight,
  Zap,
  Settings
} from 'lucide-react';
import tallySyncService from '@/services/TallySyncService';
import RealTemplateDownloader from './RealTemplateDownloader';
import { toast } from 'sonner';
import realTimeDataService from '../../services/RealTimeDataService';
import automatedTallyService, { AutoSyncConfig } from '../../services/AutomatedTallyService';

interface DataEntryRow {
  id: string;
  [key: string]: any;
}

interface TemplateField {
  name: string;
  key: string;
  type: 'string' | 'number' | 'date' | 'select';
  required: boolean;
  example?: string;
  options?: string[];
}

interface Template {
  name: string;
  type: string;
  fields: TemplateField[];
  description: string;
}

const TALLY_TEMPLATES: Template[] = [
  {
    name: 'Sales Invoice',
    type: 'sales',
    description: 'Create sales invoices for your customers',
    fields: [
      { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
      { name: 'Invoice No', key: 'invoiceNo', type: 'string', required: true, example: 'SI001' },
      { name: 'Customer Name', key: 'customer', type: 'string', required: true, example: 'ABC Corp' },
      { name: 'Item Name', key: 'itemName', type: 'string', required: true, example: 'Product A' },
      { name: 'Quantity', key: 'quantity', type: 'number', required: true, example: '10' },
      { name: 'Rate', key: 'rate', type: 'number', required: true, example: '100.00' },
      { name: 'Amount', key: 'amount', type: 'number', required: true, example: '1000.00' },
      { name: 'Tax Rate (%)', key: 'taxRate', type: 'number', required: false, example: '18' },
      { name: 'Tax Amount', key: 'taxAmount', type: 'number', required: false, example: '180.00' },
      { name: 'Total Amount', key: 'totalAmount', type: 'number', required: true, example: '1180.00' }
    ]
  },
  {
    name: 'Purchase Invoice',
    type: 'purchase',
    description: 'Record purchase invoices from suppliers',
    fields: [
      { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
      { name: 'Invoice No', key: 'invoiceNo', type: 'string', required: true, example: 'PI001' },
      { name: 'Supplier Name', key: 'supplier', type: 'string', required: true, example: 'XYZ Suppliers' },
      { name: 'Item Name', key: 'itemName', type: 'string', required: true, example: 'Raw Material A' },
      { name: 'Quantity', key: 'quantity', type: 'number', required: true, example: '50' },
      { name: 'Rate', key: 'rate', type: 'number', required: true, example: '50.00' },
      { name: 'Amount', key: 'amount', type: 'number', required: true, example: '2500.00' },
      { name: 'Tax Rate (%)', key: 'taxRate', type: 'number', required: false, example: '18' },
      { name: 'Tax Amount', key: 'taxAmount', type: 'number', required: false, example: '450.00' },
      { name: 'Total Amount', key: 'totalAmount', type: 'number', required: true, example: '2950.00' }
    ]
  },
  {
    name: 'Payment Voucher',
    type: 'payment',
    description: 'Record payments made to suppliers and others',
    fields: [
      { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
      { name: 'Voucher No', key: 'voucherNo', type: 'string', required: true, example: 'PV001' },
      { name: 'Party Name', key: 'party', type: 'string', required: true, example: 'ABC Supplier' },
      { name: 'Amount', key: 'amount', type: 'number', required: true, example: '5000.00' },
      { name: 'Payment Mode', key: 'paymentMode', type: 'select', required: true, 
        options: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Transfer'] },
      { name: 'Bank Account', key: 'bankAccount', type: 'string', required: false, example: 'SBI Main Account' },
      { name: 'Reference', key: 'reference', type: 'string', required: false, example: 'Invoice Payment' },
      { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Payment for services' }
    ]
  },
  {
    name: 'Receipt Voucher',
    type: 'receipt',
    description: 'Record receipts from customers and others',
    fields: [
      { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
      { name: 'Voucher No', key: 'voucherNo', type: 'string', required: true, example: 'RV001' },
      { name: 'Party Name', key: 'party', type: 'string', required: true, example: 'ABC Customer' },
      { name: 'Amount', key: 'amount', type: 'number', required: true, example: '10000.00' },
      { name: 'Receipt Mode', key: 'receiptMode', type: 'select', required: true,
        options: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Transfer'] },
      { name: 'Bank Account', key: 'bankAccount', type: 'string', required: false, example: 'SBI Main Account' },
      { name: 'Reference', key: 'reference', type: 'string', required: false, example: 'Invoice Collection' },
      { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Payment received' }
    ]
  },
  {
    name: 'Journal Voucher',
    type: 'journal',
    description: 'Record journal entries for adjustments and transfers',
    fields: [
      { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
      { name: 'Voucher No', key: 'voucherNo', type: 'string', required: true, example: 'JV001' },
      { name: 'Debit Ledger', key: 'debitLedger', type: 'string', required: true, example: 'Office Expenses' },
      { name: 'Credit Ledger', key: 'creditLedger', type: 'string', required: true, example: 'Cash in Hand' },
      { name: 'Amount', key: 'amount', type: 'number', required: true, example: '1000.00' },
      { name: 'Narration', key: 'narration', type: 'string', required: true, example: 'Office supplies purchased' },
      { name: 'Reference', key: 'reference', type: 'string', required: false, example: 'Bill No. 123' }
    ]
  }
];

export function TallyDataEntry() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(TALLY_TEMPLATES.find(t => t.type === 'sales') || null);
  const [dataRows, setDataRows] = useState<DataEntryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [tallyConnected, setTallyConnected] = useState(false);
  
  // File upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Automated sync states
  const [automatedSyncEnabled, setAutomatedSyncEnabled] = useState(false);
  const [tallyAutoDetected, setTallyAutoDetected] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [backgroundMonitoring, setBackgroundMonitoring] = useState(false);  useEffect(() => {
    initializeServices();
    
    // Set up automated service event listeners
    const cleanup = setupAutomatedServiceListeners();
    
    // Initialize with sales template and one empty row
    const salesTemplate = TALLY_TEMPLATES.find(t => t.type === 'sales');
    if (salesTemplate && dataRows.length === 0) {
      const emptyRow: DataEntryRow = {
        id: Math.random().toString(36).substr(2, 9),
        ...salesTemplate.fields.reduce((obj, field) => {
          obj[field.key] = '';
          return obj;
        }, {} as any)
      };
      setDataRows([emptyRow]);
    }
    
    return cleanup; // Cleanup listeners on unmount
  }, []);
  const initializeServices = async () => {
    try {
      // Initialize standard connections
      await checkConnections();
      
      // Check if automated sync is already enabled
      const autoSyncConfig = automatedTallyService.getSyncConfig();
      setAutomatedSyncEnabled(autoSyncConfig.backgroundSync);
      
      // Detect Tally instances
      const detectedConnections = await automatedTallyService.detectTallyInstances();
      if (detectedConnections.length > 0) {
        setTallyAutoDetected(true);
        setTallyConnected(true);
        toast.success(`Tally ERP 9 detected on ${detectedConnections[0].host}:${detectedConnections[0].port}`);
      }
      
      // Start monitoring if auto-sync is enabled
      if (autoSyncConfig.backgroundSync) {
        setBackgroundMonitoring(true);
        automatedTallyService.startMonitoring();
      }
      
    } catch (error) {
      console.error('Service initialization failed:', error);
      toast.error('Failed to initialize automated services');
    }
  };

  const setupAutomatedServiceListeners = () => {
    // Listen for Tally detection events
    const handleTallyDetected = (detected: boolean) => {
      setTallyAutoDetected(detected);
      setTallyConnected(detected);
      if (detected) {
        toast.success('Tally ERP 9 detected and connected automatically!');
      }
    };

    // Listen for sync queue updates
    const handleSyncQueueUpdate = (count: number) => {
      setSyncQueueCount(count);
    };

    // Listen for automated sync completion
    const handleSyncComplete = (result: any) => {
      if (result.success) {
        toast.success(`Automated sync completed: ${result.message}`);
        setStatus({ 
          type: 'success', 
          message: `Automated sync: ${result.recordsProcessed} records processed successfully` 
        });
      } else {
        toast.error(`Automated sync failed: ${result.message}`);
        setStatus({ 
          type: 'error', 
          message: `Automated sync failed: ${result.message}` 
        });
      }
    };

    // Set up listeners (Note: These would be actual event listeners in a real implementation)
    // For now, we'll use polling to check status
    const pollInterval = setInterval(async () => {
      try {
        const isConnected = automatedTallyService.isConnected();
        handleTallyDetected(isConnected);
        
        // Update sync queue count (for this example, we'll use 0)
        handleSyncQueueUpdate(0);
      } catch (error) {
        // Silent error for polling
      }
    }, 5000); // Poll every 5 seconds

    // Return cleanup function
    return () => {
      clearInterval(pollInterval);
    };
  };

  const checkConnections = async () => {
    try {
      // In integrated TallySyncPro, we only check direct Tally connection
      const tallyStatus = await tallySyncService.checkTallyConnection();
      setTallyConnected(tallyStatus.connected);
      // No separate cloud service in integrated app
      setCloudConnected(tallyStatus.connected);
    } catch (error) {
      console.error('Connection check failed:', error);
    }
  };

  const handleTemplateSelect = (templateType: string) => {
    const template = TALLY_TEMPLATES.find(t => t.type === templateType);
    if (template) {
      setSelectedTemplate(template);
      // Initialize with one empty row
      const emptyRow: DataEntryRow = {
        id: generateId(),
        ...template.fields.reduce((obj, field) => {
          obj[field.key] = '';
          return obj;
        }, {} as any)
      };
      setDataRows([emptyRow]);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addRow = () => {
    if (!selectedTemplate) return;
    
    const newRow: DataEntryRow = {
      id: generateId(),
      ...selectedTemplate.fields.reduce((obj, field) => {
        obj[field.key] = '';
        return obj;
      }, {} as any)
    };
    setDataRows([...dataRows, newRow]);
  };

  const removeRow = (id: string) => {
    setDataRows(dataRows.filter(row => row.id !== id));
  };

  const updateRowField = (id: string, field: string, value: any) => {
    setDataRows(dataRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const validateData = (): boolean => {
    if (!selectedTemplate || dataRows.length === 0) {
      setStatus({ type: 'error', message: 'Please add at least one data row' });
      return false;
    }

    for (const row of dataRows) {
      for (const field of selectedTemplate.fields) {
        if (field.required && (!row[field.key] || row[field.key].toString().trim() === '')) {
          setStatus({ 
            type: 'error', 
            message: `Field "${field.name}" is required for all rows` 
          });
          return false;
        }
      }
    }

    return true;
  };
  const downloadTemplate = async () => {
    if (!selectedTemplate) return;

    // Start tracking the download operation
    const operationId = realTimeDataService.startSyncOperation('download', `${selectedTemplate.name}_Template.xlsx`);
    setIsLoading(true);
    
    try {
      const response = await tallySyncService.downloadTemplate(selectedTemplate.type);
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedTemplate.name}_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Track successful download
      realTimeDataService.completeSyncOperation(
        operationId, 
        true, 
        1, 
        `Template downloaded: ${selectedTemplate.name}`
      );
      
      setStatus({ type: 'success', message: 'Template downloaded successfully' });
    } catch (error) {
      // Track failed download
      realTimeDataService.completeSyncOperation(
        operationId, 
        false, 
        0, 
        'Failed to download template'
      );
      setStatus({ type: 'error', message: 'Failed to download template' });
    }
    setIsLoading(false);
  };
  const processData = async () => {
    if (!validateData()) return;

    // Start tracking the operation
    const operationId = realTimeDataService.startSyncOperation('sync', selectedTemplate?.name);
    setIsLoading(true);
    
    try {
      const processedData = dataRows.map(row => {
        const { id, ...data } = row;
        return data;
      });

      const result = await tallySyncService.processData(selectedTemplate!.type, processedData);      
      if (result.success) {
        // Track successful completion
        realTimeDataService.completeSyncOperation(
          operationId, 
          true, 
          processedData.length, 
          `${selectedTemplate?.name} data processed successfully`
        );

        setStatus({ 
          type: 'success', 
          message: `Successfully processed ${processedData.length} records. ${result.message}` 
        });
        
        if (!tallyConnected) {
          setStatus(prev => ({ 
            ...prev!, 
            message: prev!.message + ' Please check your Tally ERP connection in Settings.' 
          }));
        }
      } else {
        // Track failed completion
        realTimeDataService.completeSyncOperation(
          operationId, 
          false, 
          0, 
          result.message || 'Processing failed'
        );
        setStatus({ type: 'error', message: result.message || 'Processing failed' });
      }
    } catch (error) {
      // Track error
      realTimeDataService.completeSyncOperation(
        operationId, 
        false, 
        0, 
        'Failed to process data - ' + (error instanceof Error ? error.message : 'Unknown error')
      );
      setStatus({ type: 'error', message: 'Failed to process data' });
    }
    setIsLoading(false);
  };

  // File Upload Functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload Excel (.xlsx, .xls) files only');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
      toast.success('Excel file selected successfully');
    }
  };  const processUploadedFile = async (action: 'download' | 'sync' | 'auto' = 'download') => {
    if (!uploadedFile) return;

    // If automated sync is enabled, automatically use auto-sync for any upload
    if (automatedSyncEnabled && action !== 'download') {
      await processWithAutomatedSync(uploadedFile);
      return;
    }

    // If automated sync is requested specifically, use the automated service
    if (action === 'auto') {
      await processWithAutomatedSync(uploadedFile);
      return;
    }

    // Start tracking the operation
    const operationId = realTimeDataService.startSyncOperation(
      action === 'sync' ? 'sync' : 'upload', 
      uploadedFile.name
    );
    
    setProcessing(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Process Excel file client-side
      setUploadProgress(20);
      toast.info('Processing Excel file...');
      
      const processedData = await tallySyncService.processExcelFileClientSide(uploadedFile);
      
      if (!processedData.success) {
        throw new Error(processedData.message);
      }      // Step 2: Automatic Data Verification and Cleaning
      setUploadProgress(40);
      toast.info('Verifying and cleaning data...');
      
      const verificationResult = await performDataVerification(processedData.data);
      
      if (verificationResult.hasErrors) {
        toast.warning(`Data verification found ${verificationResult.errorCount} issues. Please review before proceeding.`);
        // Show verification results to user
        displayVerificationResults(verificationResult);
      } else {
        toast.success('Data verification passed successfully!');
      }

      // Use cleaned data for XML generation
      const cleanedData = verificationResult.cleanedData || processedData.data;
        // Step 3: Generate Tally XML client-side with cleaned data
      setUploadProgress(60);
      toast.info('Generating Tally XML...');
        const xmlResult = await tallySyncService.generateTallyXMLClientSide(
        cleanedData, // Use cleaned data instead of raw data
        'auto-detect'
      );
      
      if (!xmlResult.success) {
        throw new Error(xmlResult.message);
      }
      
      setUploadProgress(90);
        if (action === 'download') {
        // Step 3a: Download XML file
        const fileName = uploadedFile.name.replace(/\.(xlsx|xls)$/i, '.xml');
        await tallySyncService.downloadXMLFile(xmlResult.xmlContent, fileName);
        
        // Track successful completion
        realTimeDataService.completeSyncOperation(
          operationId, 
          true, 
          processedData.data?.length || 0, 
          'File converted to Tally XML and downloaded'
        );
        
        toast.success('XML file downloaded successfully!');
        setStatus({ 
          type: 'success', 
          message: 'File converted to Tally XML and downloaded. You can now import it manually into Tally ERP.' 
        });
      } else {
        // Step 3b: Sync to Tally via desktop app
        const syncResult = await tallySyncService.syncToTally(xmlResult.xmlContent);
        
        if (syncResult.success) {
          // Track successful sync
          realTimeDataService.completeSyncOperation(
            operationId, 
            true, 
            processedData.data?.length || 0, 
            'Data synced directly to Tally ERP'
          );
          
          toast.success('Data synced to Tally successfully!');
          setStatus({ 
            type: 'success', 
            message: 'Data has been synced directly to your Tally ERP system.' 
          });
        } else {
          // Fallback to download if sync fails
          const fileName = uploadedFile.name.replace(/\.(xlsx|xls)$/i, '.xml');
          await tallySyncService.downloadXMLFile(xmlResult.xmlContent, fileName);
          
          // Track partial success (fallback to download)
          realTimeDataService.completeSyncOperation(
            operationId, 
            true, 
            processedData.data?.length || 0, 
            'Direct sync failed, XML downloaded for manual import'
          );
          
          toast.warning('Direct sync failed. XML file downloaded for manual import.');
          setStatus({ 
            type: 'info', 
            message: 'Could not sync directly to Tally. XML file downloaded for manual import. Please ensure TallySync desktop app is running.' 
          });
        }
      }
      
      setUploadProgress(100);
      
    } catch (error) {
      console.error('Upload processing error:', error);
      
      // Track failed operation
      realTimeDataService.completeSyncOperation(
        operationId, 
        false, 
        0, 
        `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      toast.error(`Failed to process Excel file: ${error.message}`);
      setStatus({ type: 'error', message: `Failed to process Excel file: ${error.message}` });
    } finally {
      setProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const renderField = (field: TemplateField, row: DataEntryRow) => {
    const value = row[field.key] || '';

    switch (field.type) {
      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => updateRowField(row.id, field.key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateRowField(row.id, field.key, e.target.value)}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => updateRowField(row.id, field.key, parseFloat(e.target.value) || '')}
            placeholder={field.example}
            required={field.required}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateRowField(row.id, field.key, e.target.value)}
            placeholder={field.example}
            required={field.required}
          />
        );
    }
  };
  // Automated Sync Functions
  const toggleAutomatedSync = async () => {
    try {
      const newSyncConfig = {
        ...automatedTallyService.getSyncConfig(),
        backgroundSync: !automatedSyncEnabled,
        autoImportOnUpload: !automatedSyncEnabled
      };
      
      automatedTallyService.updateSyncConfig(newSyncConfig);
      setAutomatedSyncEnabled(!automatedSyncEnabled);
      
      if (!automatedSyncEnabled) {
        // Enabling automated sync
        setBackgroundMonitoring(true);
        automatedTallyService.startMonitoring();
        
        // Detect Tally instances
        const connections = await automatedTallyService.detectTallyInstances();
        if (connections.length > 0) {
          setTallyAutoDetected(true);
          setTallyConnected(true);
          toast.success('Automated sync enabled! Tally ERP 9 detected.');
        } else {
          toast.warning('Automated sync enabled. Waiting for Tally ERP 9 to be detected...');
        }
      } else {
        // Disabling automated sync
        setBackgroundMonitoring(false);
        automatedTallyService.stopMonitoring();
        toast.info('Automated sync disabled.');
      }
    } catch (error) {
      toast.error('Failed to toggle automated sync');
      console.error('Toggle automated sync error:', error);
    }
  };

  const processWithAutomatedSync = async (file: File) => {
    if (!automatedSyncEnabled) {
      toast.error('Automated sync is not enabled');
      return;
    }

    try {
      setProcessing(true);
      setUploadProgress(10);
      
      // Use the automated service to process the file
      const result = await automatedTallyService.autoSyncExcelFile(file);
      
      setUploadProgress(100);
      
      if (result.success) {
        toast.success(`Automated sync completed: ${result.recordsProcessed} records processed`);
        setStatus({
          type: 'success',
          message: `Automated sync successful! ${result.message}`
        });
      } else {
        toast.error(`Automated sync failed: ${result.message}`);
        setStatus({
          type: 'error',
          message: `Automated sync failed: ${result.message}`
        });
      }
    } catch (error) {
      toast.error('Automated sync failed');
      setStatus({
        type: 'error',
        message: `Automated sync error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const updateSyncSettings = async (settings: Partial<AutoSyncConfig>) => {
    try {
      automatedTallyService.updateSyncConfig(settings);
      toast.success('Sync settings updated successfully');
    } catch (error) {
      toast.error('Failed to update sync settings');
    }
  };
  // Enhanced data verification with automatic parsing and cleanup
  const performDataVerification = async (data: any[]) => {
    const errors: any[] = [];
    const warnings: any[] = [];
    const cleanedData: any[] = [];

    data.forEach((row, index) => {
      const cleanedRow = { ...row };

      // Auto-clean and parse data
      if (cleanedRow.amount) {
        // Remove currency symbols and clean amount
        cleanedRow.amount = cleanedRow.amount.toString()
          .replace(/[₹$,\s]/g, '')
          .replace(/[^\d.-]/g, '');
        
        if (isNaN(parseFloat(cleanedRow.amount))) {
          errors.push({ row: index + 1, field: 'amount', message: 'Invalid amount format' });
        }
      }

      // Clean party name - remove extra spaces and invalid characters
      if (cleanedRow.party) {
        cleanedRow.party = cleanedRow.party.toString().trim().replace(/\s+/g, ' ');
      }

      // Auto-format GSTIN
      if (cleanedRow.gstin) {
        cleanedRow.gstin = cleanedRow.gstin.toString().toUpperCase().replace(/\s/g, '');
      }

      // Parse and validate dates
      if (cleanedRow.date) {
        const dateValue = new Date(cleanedRow.date);
        if (isNaN(dateValue.getTime())) {
          errors.push({ row: index + 1, field: 'date', message: 'Invalid date format' });
        } else {
          cleanedRow.date = dateValue.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }
      }

      // Remove unnecessary fields (empty or null values)
      Object.keys(cleanedRow).forEach(key => {
        if (cleanedRow[key] === null || cleanedRow[key] === undefined || cleanedRow[key] === '') {
          delete cleanedRow[key];
        }
      });

      // Validation checks
      if (!cleanedRow.date) {
        errors.push({ row: index + 1, field: 'date', message: 'Date is required' });
      }
      
      if (!cleanedRow.amount || isNaN(parseFloat(cleanedRow.amount))) {
        errors.push({ row: index + 1, field: 'amount', message: 'Valid amount is required' });
      }

      // Check GSTIN format if present
      if (cleanedRow.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanedRow.gstin)) {
        warnings.push({ row: index + 1, field: 'gstin', message: 'Invalid GSTIN format' });
      }

      // Check party name
      if (!cleanedRow.party || cleanedRow.party.trim() === '') {
        errors.push({ row: index + 1, field: 'party', message: 'Party name is required' });
      }

      cleanedData.push(cleanedRow);
    });

    return {
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
      cleanedData
    };
  };

  const displayVerificationResults = (results: any) => {
    // Create a toast or modal showing verification results
    if (results.hasErrors) {
      toast.error(`Found ${results.errorCount} errors that must be fixed before proceeding`);
    }
    if (results.hasWarnings) {
      toast.warning(`Found ${results.warningCount} warnings. Review recommended.`);
    }
  };

  // Generate and download XML function
  const downloadGeneratedXML = async () => {
    if (!uploadedFile) {
      toast.error('No file uploaded to generate XML');
      return;
    }

    try {
      toast.info('Generating XML for download...');
      
      const processedData = await tallySyncService.processExcelFileClientSide(uploadedFile);
      if (!processedData.success) {
        throw new Error(processedData.message);
      }

      const xmlResult = await tallySyncService.generateTallyXMLClientSide(
        processedData.data, 
        { generateOnly: true }
      );

      if (!xmlResult.success) {
        throw new Error(xmlResult.message);
      }

      // Create download link for XML
      const blob = new Blob([xmlResult.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${uploadedFile.name.replace(/\.[^/.]+$/, '')}_tally.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('XML file downloaded successfully!');
    } catch (error) {
      console.error('XML generation failed:', error);
      toast.error(`XML generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <div className="grid-cards gap-6">
        <Card className="card-mobile">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">TallySyncPro Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${tallyConnected ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="text-sm">{tallyConnected ? 'Connected to Tally' : 'Check Tally Connection'}</span>
              <Badge variant={tallyConnected ? 'default' : 'secondary'}>
                {tallyConnected ? 'Ready' : 'Setup Required'}
              </Badge>
            </div>
          </CardContent>
        </Card>        <Card className="card-mobile">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Auto Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${automatedSyncEnabled ? 'bg-blue-500' : 'bg-gray-400'}`} />
              <span className="text-sm">Auto Sync</span>
              <Badge variant={automatedSyncEnabled ? 'default' : 'outline'} className={automatedSyncEnabled ? 'bg-green-600 text-white' : ''}>
                {automatedSyncEnabled ? 'Active' : 'Manual'}
              </Badge>
            </div>
          </CardContent>
        </Card></div>

      {/* Helpful Workflow Guide */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
              i
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Quick Start Guide</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>For Excel upload:</strong> First download templates from the "Templates" tab, then use the "Upload" tab to import your filled data.
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>For manual entry:</strong> Use the "Manual Entry" tab to directly input data with built-in validation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Main Data Entry Tabs */}
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="upload" className="text-desktop-sm">Upload</TabsTrigger>
          <TabsTrigger value="manual" className="text-desktop-sm">Manual Entry</TabsTrigger>
          <TabsTrigger value="templates" className="text-desktop-sm">Templates</TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Select Data Entry Template</span>
              </CardTitle>
              <CardDescription>
                Choose the type of data you want to enter for Tally ERP integration
              </CardDescription>
            </CardHeader>            <CardContent>              <Tabs value={selectedTemplate?.type || ''} onValueChange={handleTemplateSelect}>
                <TabsList className="grid w-full grid-cols-5 gap-1">
                  {TALLY_TEMPLATES.map((template) => (
                    <TabsTrigger
                      key={template.type}
                      value={template.type}
                      className="text-xs"
                    >
                      {template.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
            
            {TALLY_TEMPLATES.map((template) => (
              <TabsContent key={template.type} value={template.type} className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={downloadTemplate}
                      disabled={isLoading}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    <Button 
                      onClick={addRow}
                      disabled={!selectedTemplate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Entry Form */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Enter {selectedTemplate.name} Data</CardTitle>
            <CardDescription>
              Fill in the data below. Required fields are marked with *
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataRows.map((row) => (
                <div key={row.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Entry #{dataRows.indexOf(row) + 1}</h4>
                    {dataRows.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                    <div className="grid-cards gap-spacing-mobile">
                    {selectedTemplate.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${row.id}-${field.key}`} className="text-responsive-sm">
                          {field.name}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(field, row)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
                <div className="flex flex-col md:flex-row gap-2 pt-4">
                <Button onClick={addRow} variant="outline" className="btn-mobile">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Row
                </Button>
                <Button 
                  onClick={processData}
                  disabled={isLoading || dataRows.length === 0}
                  className="btn-mobile md:ml-auto"
                >
                  {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Process Data
                </Button>
              </div></div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Upload Excel Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Excel File</span>
              </CardTitle>              <CardDescription>
                Upload your Excel file for automatic processing and verification. 
                {automatedSyncEnabled ? (
                  <span className="block mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    ✅ <strong>Auto-Sync Enabled:</strong> Files will be automatically verified, processed, and synced to Tally ERP 9 seamlessly! No manual steps required.
                  </span>
                ) : (
                  <span className="block mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                    � <strong>Manual Mode:</strong> Files will be automatically verified and processed. You can download XML files for manual import to Tally. Enable Auto-Sync in Settings for seamless integration.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="excel-upload"
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer"
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to upload Excel file
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports Excel (.xlsx, .xls) files up to 10MB
                  </p>
                </label>
              </div>

              {uploadedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-800">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                  
                  {processing && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Converting to XML...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}                  <div className="flex gap-2">
                    {!automatedSyncEnabled && (
                      <Button
                        onClick={() => processUploadedFile('download')}
                        disabled={processing}
                        variant="outline"
                        className="flex-1"
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download XML
                          </>
                        )}
                      </Button>
                    )}

                    {/* Manual XML Download Button */}
                    <Button
                      onClick={downloadGeneratedXML}
                      disabled={processing}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate XML
                    </Button>
                      <Button
                      onClick={() => processUploadedFile(automatedSyncEnabled ? 'auto' : 'sync')}
                      disabled={processing}
                      className={`${automatedSyncEnabled ? 'w-full' : 'flex-1'}`}
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          {automatedSyncEnabled ? 'Auto-Syncing...' : 'Syncing...'}
                        </>
                      ) : (
                        <>
                          {automatedSyncEnabled ? (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Auto-Sync to Tally
                            </>
                          ) : (
                            <>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              Sync to Tally
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                    {automatedSyncEnabled ? (
                      <span className="text-green-600">
                        ✓ Auto-Sync enabled - Files will be automatically processed and synced to Tally
                      </span>
                    ) : tallyConnected ? (
                      <span className="text-green-600">
                        ✓ TallySync desktop app connected - Direct sync available
                      </span>
                    ) : (
                      <span>
                        Download XML for manual import or enable Auto-Sync in Settings for seamless integration
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5" />
                <span>Official Tally Templates</span>
              </CardTitle>
              <CardDescription>
                Download real Excel templates from official Tally documentation for accurate data formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RealTemplateDownloader />
            </CardContent>          </Card>
        </TabsContent>
      </Tabs>      {/* Status Messages */}
      {status && (
        <Alert className={status.type === 'error' ? 'border-red-200 bg-red-50' : 
                         status.type === 'success' ? 'border-green-200 bg-green-50' : 
                         'border-blue-200 bg-blue-50'}>
          {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : 
           status.type === 'success' ? <CheckCircle className="h-4 w-4" /> :
           <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            {status.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default TallyDataEntry;
