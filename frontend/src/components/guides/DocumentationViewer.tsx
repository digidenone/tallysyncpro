import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BookOpen, FileText, Download, ExternalLink, Search, ChevronRight } from 'lucide-react';
import { Input } from '../ui/input';

// Markdown rendering utility
const renderMarkdown = (content: string) => {
  return content
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 mt-8 text-gray-900 dark:text-gray-100 border-b-2 border-blue-200 pb-2">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-4 mt-6 text-gray-800 dark:text-gray-200">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-3 mt-4 text-gray-700 dark:text-gray-300">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>')
    .replace(/^\* (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300 list-disc">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300 list-decimal">$1. $2</li>')
    .replace(/\n\n/gim, '</p><p class="mb-4 text-gray-600 dark:text-gray-400 leading-relaxed">')
    .replace(/\n/gim, '<br/>');
};

interface DocSection {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'user-guide' | 'technical' | 'api';
  content: string;
  lastUpdated: string;
}

const DocumentationViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocSection | null>(null);

  const documentationSections: DocSection[] = [
    {
      id: 'user-guide',
      title: 'User Guide',
      description: 'Complete guide to using TallySyncPro for Excel to Tally integration',
      category: 'user-guide',
      content: `
# TallySyncPro User Guide

## Overview
TallySyncPro is a powerful desktop application that seamlessly integrates Excel data with Tally ERP 9, providing automated synchronization and data validation.

## Key Features
- **Automated Excel Processing**: Upload Excel files and automatically convert to Tally-compatible XML
- **Real-time Tally Integration**: Direct connection to Tally ERP 9 for instant data import
- **Data Validation**: Built-in validation ensures data integrity before import
- **Template Support**: Pre-configured templates for common Tally data types
- **Batch Processing**: Process multiple Excel files simultaneously
- **Error Reporting**: Detailed error logs and correction suggestions

## Getting Started

### 1. Initial Setup
- Download and install TallySyncPro from the official website
- Ensure Tally ERP 9 is installed and configured on your system
- Configure ODBC connection for Tally integration

### 2. Excel File Preparation
- Use the provided Excel templates for best results
- Ensure column headers match Tally field requirements
- Remove any empty rows or invalid data entries
- Save files in .xlsx format for optimal compatibility

### 3. Data Import Process
- Launch TallySyncPro application
- Navigate to Data Entry section
- Select appropriate template type
- Upload your Excel file
- Review data validation results
- Generate and download Tally XML
- Import XML into Tally ERP 9

## Advanced Features

### Custom Template Creation
Create custom templates for specific business requirements:
- Define field mappings between Excel and Tally
- Set validation rules for data quality
- Configure automatic data transformations
- Save templates for future use

### Batch Processing
Process multiple files efficiently:
- Select multiple Excel files
- Apply same template to all files
- Monitor progress in real-time
- Download consolidated XML output

### Error Management
Comprehensive error handling and reporting:
- Real-time validation during upload
- Detailed error descriptions and solutions
- Data correction suggestions
- Export error reports for analysis

## Troubleshooting

### Common Issues
- **Connection Errors**: Check Tally ODBC configuration
- **Data Validation Failures**: Review Excel file format and content
- **Import Errors**: Verify Tally company database access
- **Performance Issues**: Process smaller file batches

### Support Resources
- Built-in help documentation
- Video tutorials and guides
- Community forums and FAQ
- Technical support contact information

## Best Practices
- Always backup Tally data before importing
- Test with small datasets first
- Use provided Excel templates
- Validate data before final import
- Keep regular backups of processed files
`,
      lastUpdated: '2024-12-15'
    },
    {
      id: 'installation',
      title: 'Installation Guide',
      description: 'Step-by-step installation and setup instructions',
      category: 'getting-started',
      content: `
# Installation Guide

## System Requirements

### Minimum Requirements
- Windows 10 or later (64-bit)
- 4 GB RAM
- 500 MB free disk space
- Microsoft Excel 2016 or later
- Tally ERP 9 Release 6.0 or later

### Recommended Requirements
- Windows 11 (64-bit)
- 8 GB RAM or more
- 1 GB free disk space
- Microsoft Excel 2019 or Office 365
- Tally ERP 9 Release 6.6 or later
- Stable internet connection

## Installation Steps

### 1. Download TallySyncPro
- Visit the official website
- Download the latest installer
- Verify file integrity using provided checksums

### 2. Run Installation
- Right-click installer and select "Run as Administrator"
- Follow the installation wizard
- Choose installation directory
- Accept license agreement
- Complete installation process

### 3. Initial Configuration
- Launch TallySyncPro
- Run initial setup wizard
- Configure Tally connection settings
- Test system connectivity
- Register your license key

## Post-Installation Setup

### Tally ODBC Configuration
1. Open Tally ERP 9
2. Go to Gateway > Configure > Connectivity
3. Enable ODBC Server
4. Set appropriate port and security settings
5. Test connection from TallySyncPro

### Excel Plugin Installation
1. Close all Excel instances
2. Run TallySyncPro as administrator
3. Navigate to Settings > Excel Integration
4. Install Excel plugin components
5. Restart Excel to activate plugin

## Verification and Testing

### System Health Check
- Run built-in system diagnostics
- Verify all components are properly installed
- Test sample data import
- Confirm Tally integration works correctly

### License Activation
- Enter your license key in Settings
- Activate online or offline as needed
- Verify license status and validity
- Register for updates and support
`,
      lastUpdated: '2024-12-15'
    },
    {
      id: 'technical-specs',
      title: 'Technical Specifications',
      description: 'Detailed technical information and system architecture',
      category: 'technical',
      content: `
# Technical Specifications

## Architecture Overview

TallySyncPro is built using modern web technologies with a robust desktop application framework.

### Core Technologies
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express
- **Desktop**: Electron framework
- **Database**: SQLite for local data storage
- **Excel Processing**: SheetJS library
- **Tally Integration**: ODBC connectivity

### System Components

#### Frontend Application
- React-based user interface
- Real-time status monitoring
- Progressive web app capabilities
- Responsive design for all screen sizes

#### Backend Services
- RESTful API endpoints
- File processing services
- Data validation engine
- Tally XML generation

#### Desktop Integration
- Native OS integration
- File system access
- System tray functionality
- Auto-updater mechanism

## Data Processing Pipeline

### Excel File Processing
1. File upload and validation
2. Sheet detection and parsing
3. Data type recognition
4. Structure validation
5. Content verification

### Data Transformation
1. Field mapping application
2. Data type conversion
3. Validation rule enforcement
4. Error detection and reporting
5. XML structure generation

### Tally Integration
1. ODBC connection establishment
2. Company database verification
3. Data compatibility checking
4. XML import execution
5. Result verification

## Security Features

### Data Protection
- Local data encryption
- Secure file handling
- Memory protection
- Temporary file cleanup

### Access Control
- License-based activation
- User authentication
- Role-based permissions
- Audit logging

## Performance Optimization

### Processing Efficiency
- Multi-threaded file processing
- Memory-efficient data handling
- Optimized XML generation
- Batch processing capabilities

### Resource Management
- Automatic memory cleanup
- Efficient CPU utilization
- Minimal disk I/O operations
- Network optimization

## API Reference

### File Upload Endpoint
\`\`\`
POST /api/upload
Content-Type: multipart/form-data
Parameters: file (Excel file), template (string)
Response: Processing status and validation results
\`\`\`

### Data Validation Endpoint
\`\`\`
POST /api/validate
Content-Type: application/json
Parameters: data (array), rules (object)
Response: Validation results and error details
\`\`\`

### XML Generation Endpoint
\`\`\`
POST /api/generate-xml
Content-Type: application/json
Parameters: data (array), format (string)
Response: Generated XML content
\`\`\`

## Error Codes and Handling

### Common Error Codes
- **E001**: File format not supported
- **E002**: Data validation failed
- **E003**: Tally connection error
- **E004**: XML generation failed
- **E005**: License validation error

### Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- User notification system
- Detailed error reporting
`,
      lastUpdated: '2024-12-15'
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      description: 'Complete API documentation for developers',
      category: 'api',
      content: `
# API Reference

## Base URL
\`\`\`
http://localhost:3001/api
\`\`\`

## Authentication
All API requests require a valid API key in the request headers:
\`\`\`
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
\`\`\`

## Endpoints

### Upload Excel File
Upload and process Excel files for Tally integration.

**Endpoint:** \`POST /upload\`

**Parameters:**
- \`file\` (file): Excel file to process
- \`template\` (string): Template type identifier
- \`options\` (object): Processing options

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "rowCount": 150,
    "status": "processed"
  }
}
\`\`\`

### Validate Data
Validate processed data against Tally requirements.

**Endpoint:** \`POST /validate\`

**Parameters:**
\`\`\`json
{
  "fileId": "uuid",
  "rules": {
    "required": ["name", "amount"],
    "format": {
      "amount": "numeric",
      "date": "yyyy-mm-dd"
    }
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
\`\`\`

### Generate XML
Generate Tally-compatible XML from processed data.

**Endpoint:** \`POST /generate-xml\`

**Parameters:**
\`\`\`json
{
  "fileId": "uuid",
  "format": "tally",
  "options": {
    "compress": true,
    "validate": true
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "xml": {
    "content": "XML_CONTENT",
    "size": 15420,
    "checksum": "md5_hash"
  }
}
\`\`\`

### Sync with Tally
Directly sync data with Tally ERP 9.

**Endpoint:** \`POST /sync\`

**Parameters:**
\`\`\`json
{
  "fileId": "uuid",
  "company": "CompanyName",
  "options": {
    "backup": true,
    "validate": true
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "sync": {
    "status": "completed",
    "records": 150,
    "errors": 0
  }
}
\`\`\`

## Error Responses
All errors return a consistent format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "E001",
    "message": "File format not supported",
    "details": "Only .xlsx files are supported"
  }
}
\`\`\`

## Rate Limiting
API requests are limited to:
- 100 requests per minute for file operations
- 1000 requests per minute for data queries
- 10 concurrent file uploads

## SDKs and Libraries

### JavaScript/Node.js
\`\`\`javascript
const TallySyncAPI = require('tallysync-api');
const client = new TallySyncAPI('YOUR_API_KEY');

// Upload file
const result = await client.upload(fileBuffer, 'ledger');
console.log(result.fileId);
\`\`\`

### Python
\`\`\`python
import tallysync

client = tallysync.Client('YOUR_API_KEY')
result = client.upload('file.xlsx', template='ledger')
print(result.file_id)
\`\`\`

## Webhooks
Configure webhooks to receive real-time notifications:

**Events:**
- \`file.uploaded\`: File processing completed
- \`validation.completed\`: Data validation finished
- \`sync.completed\`: Tally sync finished
- \`error.occurred\`: Processing error

**Configuration:**
\`\`\`json
{
  "url": "https://your-app.com/webhook",
  "events": ["file.uploaded", "sync.completed"],
  "secret": "webhook_secret"
}
\`\`\`
`,
      lastUpdated: '2024-12-15'
    }
  ];

  const categories = [
    { value: 'all', label: 'All Documentation' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'user-guide', label: 'User Guide' },
    { value: 'technical', label: 'Technical' },
    { value: 'api', label: 'API Reference' }
  ];

  // FIXED PDF GENERATION FUNCTION
  const downloadPDF = async (docId: string) => {
    try {
      const doc = documentationSections.find(d => d.id === docId);
      if (!doc) return;

      // Create a new window with the content formatted for PDF
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups for PDF generation');
        return;
      }

      // Enhanced HTML content with better PDF styling
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${doc.title} - TallySyncPro Documentation</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        @page {
            margin: 1in;
            size: A4;
        }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 { 
            color: #2563eb; 
            font-size: 28px;
            margin: 0 0 10px 0;
        }
        .header h2 { 
            color: #1e40af; 
            font-size: 22px;
            margin: 0 0 10px 0;
            font-weight: normal;
        }
        .date { 
            color: #666; 
            font-size: 14px;
            margin: 10px 0;
        }
        .content h1 { 
            color: #2563eb; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 30px;
        }
        .content h2 { 
            color: #1e40af; 
            margin-top: 25px;
            margin-bottom: 15px;
        }
        .content h3 { 
            color: #1e3a8a; 
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .content p { 
            margin-bottom: 12px;
            text-align: justify;
        }
        .content ul, .content ol {
            margin: 10px 0;
            padding-left: 25px;
        }
        .content li {
            margin-bottom: 5px;
        }
        .content code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .content pre {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            overflow-x: auto;
            margin: 15px 0;
        }
        .footer { 
            margin-top: 50px; 
            text-align: center; 
            font-size: 12px; 
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .download-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
            font-size: 16px;
            font-weight: 500;
        }
        .download-btn:hover {
            background: #1d4ed8;
        }
        .close-btn {
            background: #dc2626;
        }
        .close-btn:hover {
            background: #b91c1c;
        }
    </style>
</head>
<body>
    <div class="no-print" style="position: fixed; top: 20px; right: 20px; z-index: 1000; background: rgba(255,255,255,0.9); padding: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <button class="download-btn" onclick="window.print()">📄 Save as PDF</button>
        <button class="download-btn close-btn" onclick="window.close()">✖ Close</button>
    </div>
    
    <div class="header">
        <h1>TallySyncPro Documentation</h1>
        <h2>${doc.title}</h2>
        <div class="date">Generated on: ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
    </div>
    
    <div class="content">
        ${renderMarkdown(doc.content)}
    </div>
    
    <div class="footer">
        <p><strong>TallySyncPro</strong> - Professional Tally ERP Integration Platform</p>
        <p>© 2025 Digidenone. All rights reserved.</p>
        <p>Document ID: ${docId} | Version: 1.0</p>
    </div>

    <script>
        // Instructions for saving as PDF
        window.onload = function() {
            setTimeout(() => {
                window.focus();
                console.log('Ready to save as PDF. Click the "Save as PDF" button or use Ctrl+P');
            }, 1000);
        };
    </script>
</body>
</html>`;

      // Write content to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Show success message
      console.log(`PDF generation window opened for: ${doc.title}`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Filter documentation sections
  const filteredDocs = documentationSections.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (selectedDoc) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{selectedDoc.title}</span>
              </CardTitle>
              <CardDescription>{selectedDoc.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => downloadPDF(selectedDoc.id)}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={() => setSelectedDoc(null)} variant="outline" size="sm">
                ← Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto">
          <div 
            className="prose max-w-none dark:prose-invert prose-blue"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedDoc.content) }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Documentation Center</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive guides, technical documentation, and API references for TallySyncPro
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <Card key={doc.id} className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {doc.category.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Badge>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription className="text-sm line-clamp-3">
                    {doc.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => downloadPDF(doc.id)}
                    variant="outline" 
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => setSelectedDoc(doc)}
                    variant="outline" 
                    size="sm"
                  >
                    View <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documentation found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or category filter
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentationViewer;
