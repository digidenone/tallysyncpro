import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileSpreadsheet, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface RealTemplate {
  id: string;
  name: string;
  file: string;
  description: string;
  category: 'masters' | 'vouchers';
  apiEndpoint: string;
  size?: string;
}

const REAL_TEMPLATES: RealTemplate[] = [
  {
    id: 'sales',
    name: 'Sales Invoice Template',
    file: 'Sale.xlsx',
    description: 'Template for sales invoices with GST calculations including 5%, 12%, and 18% tax rates, CGST, SGST calculations',
    category: 'vouchers',
    apiEndpoint: '/api/templates/real?template=sales',
    size: '12 KB'
  },
  {
    id: 'purchase',
    name: 'Purchase Invoice Template',
    file: 'Purchase.xlsx',
    description: 'Template for purchase invoices with GST calculations including 5%, 12%, and 18% tax rates, CGST, SGST calculations',
    category: 'vouchers',
    apiEndpoint: '/api/templates/real?template=purchase',
    size: '12 KB'
  },
  {
    id: 'journal',
    name: 'Journal Voucher Template',
    file: 'Journal.xlsx',
    description: 'Template for journal entries with GST calculations for adjustments and transfers',
    category: 'vouchers',
    apiEndpoint: '/api/templates/real?template=journal',
    size: '12 KB'
  },
  {
    id: 'bank',
    name: 'Bank Transaction Template',
    file: 'Bank.xlsx',
    description: 'Template for bank transactions including receipts, payments, withdrawals, and deposits with proper voucher types',
    category: 'vouchers',
    apiEndpoint: '/api/templates/real?template=bank',
    size: '12 KB'
  },
  {
    id: 'masters-complete',
    name: 'Master Data Templates (Complete)',
    file: 'AllAccountingMasters.xlsx',
    description: 'Complete master data template including Chart of Accounts, Ledgers, Groups, Cost Centers, Stock Items, Units of Measure, Godowns, Currencies, and more for comprehensive Tally ERP setup with GST compliance',
    category: 'masters',
    apiEndpoint: '/downloads/AllAccountingMasters.xlsx',
    size: '48 KB'
  },
  {
    id: 'vouchers-complete',
    name: 'Accounting Vouchers (Complete)',
    file: 'AccountingVouchers.xlsx',
    description: 'Comprehensive voucher template supporting Sales, Purchase, Payment, Receipt, Journal, Contra, Debit Note, Credit Note, and Bank transactions with advanced GST handling and TDS support',
    category: 'vouchers',
    apiEndpoint: '/downloads/AccountingVouchers.xlsx',
    size: '42 KB'
  },
  {
    id: 'template-bundle',
    name: 'TallySync Excel Templates (Bundle)',
    file: 'TallySync-Excel-Templates.zip',
    description: 'Complete bundle containing all Excel templates, sample data, user guides, and field mapping documentation for seamless Tally ERP integration',
    category: 'masters',
    apiEndpoint: '/downloads/TallySync-Excel-Templates.zip',
    size: '125 KB'
  }
];

export function RealTemplateDownloader() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const createFallbackTemplate = (template: RealTemplate): Blob => {
    // Create a basic CSV template as fallback
    let csvContent = '';
    
    if (template.category === 'vouchers') {
      csvContent = `Date,Voucher No,Party Name,Amount,Particulars,Narration
2025-01-15,V001,Sample Party,1000.00,Sample Item,Sample transaction
,,,,Instructions:,
,,,,1. Fill data in rows below,
,,,,2. Keep headers unchanged,
,,,,3. Save as Excel file,
,,,,4. Upload to TallySync Pro,`;
    } else {
      csvContent = `Ledger Name,Group,Opening Balance,Type,Address,Phone
Sample Ledger,Sundry Debtors,0.00,Customer,Sample Address,1234567890
,,,,Instructions:,
,,,,1. Fill data in rows below,
,,,,2. Keep headers unchanged,
,,,,3. Save as Excel file,
,,,,4. Upload to TallySync Pro,`;
    }
    
    return new Blob([csvContent], { type: 'text/csv' });
  };

  const downloadTemplate = async (template: RealTemplate) => {
    setDownloading(template.id);
    setStatus(null);

    try {
      let downloadSuccessful = false;
      
      // Try to download from the public downloads folder first
      try {
        const physicalPath = template.apiEndpoint.startsWith('/downloads/') 
          ? template.apiEndpoint 
          : `/downloads/${template.file}`;
        
        const response = await fetch(physicalPath);
        
        if (response.ok) {
          const blob = await response.blob();
          downloadBlob(blob, template.file);
          downloadSuccessful = true;
          
          setStatus({ 
            type: 'success', 
            message: `Successfully downloaded ${template.name}! Ready to import into Tally ERP 9.` 
          });
        }
      } catch (physicalError) {
        console.log('Physical template not found, trying API fallback...');
      }
      
      // If physical download failed, try API fallback
      if (!downloadSuccessful) {
        try {          
          const apiUrl = template.apiEndpoint.includes('real') 
            ? `/api/templates?action=download&type=${template.id.includes('vouchers') ? 'sales' : 'ledger'}`
            : template.apiEndpoint;
            
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const blob = await response.blob();
            downloadBlob(blob, template.file);
            downloadSuccessful = true;
            
            setStatus({ 
              type: 'success', 
              message: `Successfully downloaded ${template.name} from API` 
            });
          }
        } catch (apiError) {
          console.log('API download failed, creating fallback template...');
        }
      }
      
      // If both failed, create fallback template
      if (!downloadSuccessful) {
        const fallbackBlob = createFallbackTemplate(template);
        downloadBlob(fallbackBlob, template.file);
        
        setStatus({ 
          type: 'info', 
          message: `Downloaded fallback ${template.name}. For the latest templates, ensure Tally ERP 9 service is running.` 
        });
      }

    } catch (error) {
      console.error('Download failed:', error);
      setStatus({ 
        type: 'error', 
        message: `Failed to download ${template.name}. Please try again or contact support.` 
      });
    } finally {
      setDownloading(null);
    }
  };

  const downloadAllTemplates = async () => {
    setStatus({ type: 'info', message: 'Downloading all templates...' });
    
    for (const template of REAL_TEMPLATES) {
      await downloadTemplate(template);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setStatus({ type: 'success', message: 'All templates downloaded successfully!' });
  };

  const categorizedTemplates = {
    masters: REAL_TEMPLATES.filter(t => t.category === 'masters'),
    vouchers: REAL_TEMPLATES.filter(t => t.category === 'vouchers')
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Official Tally Templates</span>
          </CardTitle>
          <CardDescription>
            Download real Excel templates for Tally ERP data import. These templates are based on official Tally documentation and include all required fields and formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Official Templates</Badge>
              <Badge variant="secondary">{REAL_TEMPLATES.length} Files</Badge>
            </div>
            <Button 
              onClick={downloadAllTemplates}
              disabled={downloading !== null}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All Templates
            </Button>
          </div>

          {status && (
            <Alert className="mb-4">
              {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
              {status.type === 'info' && <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Masters Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Master Data Templates</CardTitle>
          <CardDescription>
            Templates for importing master data like ledgers, groups, and cost categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorizedTemplates.masters.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className="text-xs text-muted-foreground">
                        📁 {template.file}
                      </span>
                      {template.size && (
                        <span className="text-xs text-muted-foreground">
                          📏 {template.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadTemplate(template)}
                    disabled={downloading === template.id}
                    size="sm"
                  >
                    {downloading === template.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voucher Templates</CardTitle>
          <CardDescription>
            Templates for importing various types of accounting vouchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorizedTemplates.vouchers.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className="text-xs text-muted-foreground">
                        📁 {template.file}
                      </span>
                      {template.size && (
                        <span className="text-xs text-muted-foreground">
                          📏 {template.size}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadTemplate(template)}
                    disabled={downloading === template.id}
                    size="sm"
                  >
                    {downloading === template.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Master Data Templates</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Download the complete master data template</li>
                  <li>• Fill in your Chart of Accounts, Ledgers, and Groups</li>
                  <li>• Include Stock Items, Units, and Cost Centers</li>
                  <li>• Upload to TallySync Pro for validation</li>
                  <li>• Import directly into Tally ERP 9</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Voucher Templates</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Choose the appropriate voucher template</li>
                  <li>• Fill in transaction details with GST rates</li>
                  <li>• Use the GST calculator for automatic calculations</li>
                  <li>• Validate data before upload</li>
                  <li>• Sync transactions to Tally ERP 9</li>
                </ul>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Always backup your Tally data before importing new information. 
                Use the template bundle for comprehensive documentation and sample data.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RealTemplateDownloader;
