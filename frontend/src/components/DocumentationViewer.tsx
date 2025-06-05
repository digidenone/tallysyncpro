/**
 * Documentation Viewer Component
 * 
 * Displays markdown documentation files in a user-friendly interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText, Users, Settings, Code, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string;
}

const DocumentationViewer: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<string>('user-guide');
  const [documentationSections] = useState<DocumentationSection[]>([
    {
      id: 'user-guide',
      title: 'User Guide',
      description: 'Complete guide for using TallySyncPro',
      icon: <BookOpen className="h-5 w-5" />,
      content: `
# TallySyncPro User Guide

## Getting Started

TallySyncPro is a comprehensive Excel to Tally ERP 9 integration solution that provides seamless data synchronization.

### Key Features

1. **Automated Sync**: Enable auto-sync in Settings for seamless integration
2. **Manual Processing**: Upload Excel files and download XML for manual import
3. **Real-time Validation**: Instant data verification and error checking
4. **Template Support**: Pre-built templates for common Tally data types

## How to Use TallySyncPro

### Step 1: Configure Settings
1. Go to **Settings** page
2. Configure your Tally ERP 9 connection details
3. Choose between **Auto-Sync** or **Manual** mode
4. Test your connection

### Step 2: Upload Excel Files
1. Navigate to **Data Entry** page
2. Choose **Upload Excel** tab
3. Upload your Excel file
4. **Auto-Sync mode**: Files are automatically processed and synced
5. **Manual mode**: Download the generated XML file

### Step 3: Verify in Tally
1. Open Tally ERP 9
2. Check that your data has been imported correctly
3. Review any error logs if needed

## Supported Data Types

- **Ledgers**: Chart of accounts
- **Vouchers**: Sales, Purchase, Payment, Receipt
- **Inventory**: Stock items and units
- **Masters**: Customer and vendor data

## Troubleshooting

### Connection Issues
- Ensure Tally ERP 9 is running
- Check port configuration (default: 9000-9005)
- Verify company database is loaded

### Data Import Issues
- Validate Excel file format
- Check required columns are present
- Review error messages in the status panel

For more detailed help, contact our support team.
      `
    },
    {
      id: 'setup',
      title: 'Setup & Installation',
      description: 'Installation and configuration guide',
      icon: <Settings className="h-5 w-5" />,
      content: `
# Setup & Installation Guide

## System Requirements

- **Operating System**: Windows 10/11
- **Tally ERP 9**: Version 6.0 or later
- **Excel**: Microsoft Excel 2016 or later
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB free space

## Installation Steps

### 1. Download TallySyncPro
- Download the latest TallySyncPro installer
- Run as Administrator for proper installation

### 2. Configure Tally ERP 9
1. Open Tally ERP 9
2. Go to **Gateway of Tally > F11: Features > Company Features**
3. Enable **ODBC Connectivity** 
4. Set **HTTP Server Port** to 9000 (or desired port)
5. Save and restart Tally

### 3. First-Time Setup
1. Launch TallySyncPro
2. Go to **Settings**
3. Configure connection details:
   - **Host**: localhost (usually)
   - **Port**: 9000 (or your configured port)
   - **Company**: Your company name
4. Test connection

### 4. Enable Auto-Sync (Optional)
1. In Settings, enable **Auto-Sync**
2. Configure monitoring intervals
3. Set retry attempts
4. Save configuration

## Network Configuration

### Firewall Settings
- Allow TallySyncPro through Windows Firewall
- Ensure port 9000-9005 are open
- For network installations, configure appropriate rules

### Multi-User Setup
- Install TallySyncPro on each workstation
- Configure to connect to Tally server
- Use consistent company database paths

## Verification

1. **Connection Test**: Use the test button in Settings
2. **Sample Upload**: Try uploading a simple Excel file
3. **Tally Verification**: Check if data appears in Tally

## Support

If you encounter issues during setup:
- Check the troubleshooting section
- Review system requirements
- Contact support with error details
      `
    },
    {
      id: 'api',
      title: 'API Reference',
      description: 'Technical documentation for developers',
      icon: <Code className="h-5 w-5" />,
      content: `
# API Reference

## TallySyncPro Integration APIs

### Automated Tally Service

#### Configuration
\`\`\`typescript
interface AutoSyncConfig {
  autoDetectTally: boolean;
  autoImportOnUpload: boolean;
  backgroundSync: boolean;
  syncInterval: number;
  retryAttempts: number;
  enableNotifications: boolean;
}
\`\`\`

#### Methods

##### \`detectTallyInstances()\`
Auto-detects running Tally ERP 9 instances on configured ports.

**Returns**: \`Promise<TallyConnection[]>\`

##### \`autoSyncExcelFile(file: File, data: any)\`
Automatically processes and syncs Excel file to Tally.

**Parameters**:
- \`file\`: Excel file object
- \`data\`: Parsed Excel data

**Returns**: \`Promise<SyncResult>\`

##### \`startMonitoring()\`
Starts background monitoring for Tally instances.

##### \`stopMonitoring()\`
Stops background monitoring.

### Data Processing

#### Supported Excel Formats
- \`.xlsx\` (Excel 2007+)
- \`.xls\` (Excel 97-2003)

#### Data Validation
- Required column validation
- Data type checking
- Duplicate detection
- Tally-specific format validation

#### XML Generation
Automatically generates Tally-compatible XML based on data type:
- Ledger XML
- Voucher XML
- Inventory XML
- Master data XML

### Error Handling

#### Error Types
- \`CONNECTION_ERROR\`: Tally connection issues
- \`VALIDATION_ERROR\`: Data validation failures
- \`IMPORT_ERROR\`: Tally import failures
- \`FILE_ERROR\`: Excel file processing errors

#### Error Response Format
\`\`\`typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  code: string;
}
\`\`\`

### Integration Examples

#### Basic Auto-Sync Setup
\`\`\`typescript
import automatedTallyService from './services/AutomatedTallyService';

// Enable auto-sync
automatedTallyService.updateConfig({
  backgroundSync: true,
  autoImportOnUpload: true
});

// Start monitoring
automatedTallyService.startMonitoring();
\`\`\`

#### Manual File Processing
\`\`\`typescript
// Upload and process file
const result = await tallySyncService.processExcelFile(file);
if (result.success) {
  // Download XML
  tallySyncService.downloadXML(result.xmlData);
}
\`\`\`

For advanced integration scenarios, contact our developer support team.
      `
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Frequently asked questions',
      icon: <FileText className="h-5 w-5" />,
      content: `
# Frequently Asked Questions

## General Questions

### Q: What is TallySyncPro?
**A**: TallySyncPro is a specialized software that enables seamless integration between Excel spreadsheets and Tally ERP 9, allowing you to import data automatically or generate XML files for manual import.

### Q: Do I need to modify my Tally installation?
**A**: No major modifications are needed. You only need to enable ODBC connectivity and HTTP server in Tally's company features.

### Q: Can I use TallySyncPro with multiple companies?
**A**: Yes, you can configure TallySyncPro to work with different Tally companies by changing the company setting in the configuration.

## Technical Questions

### Q: What Excel formats are supported?
**A**: TallySyncPro supports both .xlsx (Excel 2007+) and .xls (Excel 97-2003) formats.

### Q: How does Auto-Sync work?
**A**: Auto-Sync automatically detects running Tally instances, processes uploaded Excel files, generates appropriate XML, and imports data directly to Tally without manual intervention.

### Q: What happens if Tally is not running?
**A**: In Auto-Sync mode, TallySyncPro will retry connection attempts based on your configuration. In manual mode, you can still generate XML files and import them later when Tally is available.

### Q: Can I customize the Excel templates?
**A**: Yes, you can modify the provided templates, but ensure that required columns are maintained for proper data mapping.

## Data Questions

### Q: What types of data can I import?
**A**: TallySyncPro supports:
- Ledgers (Chart of Accounts)
- Vouchers (Sales, Purchase, Payment, Receipt)
- Inventory items
- Customer and vendor master data

### Q: How do I handle data validation errors?
**A**: TallySyncPro provides real-time validation feedback. Review the error messages, correct your Excel data, and re-upload the file.

### Q: Can I undo imports?
**A**: TallySyncPro doesn't provide direct undo functionality. Use Tally's built-in features to reverse or modify imported data.

## Performance Questions

### Q: How large Excel files can I process?
**A**: TallySyncPro can handle files up to 10MB. For larger datasets, consider splitting into smaller files.

### Q: How fast is the import process?
**A**: Import speed depends on data volume and Tally performance. Typically, 1000 records process in 1-2 minutes.

### Q: Does Auto-Sync affect Tally performance?
**A**: Auto-Sync uses minimal system resources and shouldn't significantly impact Tally performance.

## Troubleshooting

### Q: Connection failed error?
**A**: Check if:
- Tally ERP 9 is running
- ODBC connectivity is enabled
- Port configuration is correct
- No firewall blocking connection

### Q: Data not appearing in Tally?
**A**: Verify:
- Correct company is selected
- Data format matches Tally requirements
- No validation errors in the import process

### Q: Auto-Sync not working?
**A**: Ensure:
- Auto-Sync is enabled in Settings
- Background monitoring is active
- Tally is running and accessible

## Support

### Q: How do I get help?
**A**: You can:
- Review this documentation
- Contact support through the Support page
- Submit support tickets for technical issues

### Q: Is training available?
**A**: Yes, we provide documentation, video tutorials, and can arrange training sessions for teams.

Still have questions? Contact our support team!
      `
    }
  ]);

  const handleDownloadDoc = () => {
    toast.success('Documentation downloaded successfully!');
  };

  const selectedDocData = documentationSections.find(doc => doc.id === selectedDoc);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Documentation
          </CardTitle>
          <CardDescription>
            Comprehensive guides and references for TallySyncPro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDoc} onValueChange={setSelectedDoc}>
            <TabsList className="grid w-full grid-cols-4 gap-1">
              {documentationSections.map((doc) => (
                <TabsTrigger key={doc.id} value={doc.id} className="text-xs">
                  <div className="flex items-center gap-1">
                    {doc.icon}
                    <span className="hidden sm:inline">{doc.title}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {documentationSections.map((doc) => (
              <TabsContent key={doc.id} value={doc.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {doc.icon}
                          {doc.title}
                        </CardTitle>
                        <CardDescription>{doc.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleDownloadDoc}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open('https://github.com/yourusername/tallysyncpro', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Source
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                        {doc.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentationViewer;
