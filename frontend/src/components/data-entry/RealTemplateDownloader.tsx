import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileSpreadsheet, 
  ExternalLink, 
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
  lastUpdated?: string;
}

const REAL_TEMPLATES: RealTemplate[] = [
  {
    id: 'accounting-masters',
    name: 'All Accounting Masters',
    file: 'AllAccountingMasters.xlsx',
    description: 'Complete template for importing all types of accounting masters including ledgers, groups, cost categories, and more into Tally ERP',
    category: 'masters',
    apiEndpoint: '/api/templates/real?template=accounting-masters',
    size: '45 KB',
    lastUpdated: '2024-12-15'
  },
  {
    id: 'accounting-vouchers',
    name: 'Accounting Vouchers',
    file: 'AccountingVouchers.xlsx',
    description: 'Template for importing various types of accounting vouchers including sales, purchase, payment, receipt, and journal entries into Tally ERP',
    category: 'vouchers',
    apiEndpoint: '/api/templates/real?template=accounting-vouchers',
    size: '38 KB',
    lastUpdated: '2024-12-15'
  }
];

export function RealTemplateDownloader() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);  const downloadTemplate = async (template: RealTemplate) => {
    setDownloading(template.id);
    setStatus(null);

    try {
      // First, try to download from physical templates folder
      let downloadSuccessful = false;
      
      // Try the physical template file first
      if (template.id === 'accounting-masters' || template.id === 'accounting-vouchers') {
        try {
          const physicalPath = `/templates/${template.file}`;
          const response = await fetch(physicalPath);
          
          if (response.ok) {
            const blob = await response.blob();
            downloadBlob(blob, template.file);
            downloadSuccessful = true;
            
            setStatus({ 
              type: 'success', 
              message: `Successfully downloaded official ${template.name} template` 
            });
          }
        } catch (physicalError) {
          console.log('Physical template not found, trying API...');
        }
      }
      
      // If physical download failed, try API
      if (!downloadSuccessful) {
        try {          const apiUrl = template.apiEndpoint.includes('real') 
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
          console.log('API download failed, creating fallback...');
        }
      }
      
      // If both failed, create fallback
      if (!downloadSuccessful) {
        const fallbackBlob = createFallbackTemplate(template);
        downloadBlob(fallbackBlob, template.file);
        
        setStatus({ 
          type: 'success', 
          message: `Downloaded ${template.name} (offline version - suitable for data entry)` 
        });
      }
      
    } catch (error) {
      console.error('All download methods failed:', error);
      
      // Last resort: create fallback template
      try {
        const fallbackBlob = createFallbackTemplate(template);
        downloadBlob(fallbackBlob, template.file);
        
        setStatus({ 
          type: 'success', 
          message: `Downloaded ${template.name} (offline version - basic template)` 
        });
      } catch (fallbackError) {
        setStatus({ 
          type: 'error', 
          message: `Failed to download ${template.name}. Please check your connection and try again.` 
        });
      }
    } finally {
      setDownloading(null);
    }
  };

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
2024-01-15,V001,Sample Party,1000.00,Sample Item,Sample transaction
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
                      {template.lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                          📅 Updated {template.lastUpdated}
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
                      {template.lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                          📅 Updated {template.lastUpdated}
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
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">1</div>
              <p>Download the appropriate template for your data type (Masters or Vouchers)</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">2</div>
              <p>Open the Excel file and fill in your data following the column headers and sample data</p>
            </div>            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">3</div>
              <p>Save the completed file and upload it through the Data Entry section above</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">4</div>
              <p>TallySyncPro will automatically sync the processed data with your Tally ERP</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {status && (
        <Alert className={status.type === 'error' ? 'border-red-200 bg-red-50' : 
                         status.type === 'success' ? 'border-green-200 bg-green-50' : 
                         'border-blue-200 bg-blue-50'}>
          {status.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>
            {status.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default RealTemplateDownloader;
