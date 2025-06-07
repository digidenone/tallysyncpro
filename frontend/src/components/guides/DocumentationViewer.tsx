import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BookOpen, FileText, Download, Search } from 'lucide-react';
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
  category: 'getting-started' | 'user-guide' | 'technical';
  content: string;
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
- Community forums and FAQ
- Technical support contact information

## Best Practices
- Always backup Tally data before importing
- Test with small datasets first
- Use provided Excel templates
- Validate data before final import
- Keep regular backups of processed files
      `
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

## Verification and Testing

### System Health Check
- Run built-in system diagnostics
- Verify all components are properly installed
- Test sample data import
- Confirm Tally integration works correctly
      `
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
      `
    },
  ];

  const categories = [
    { value: 'all', label: 'All Documentation' },
    { value: 'getting-started', label: 'Getting Started' },
    { value: 'user-guide', label: 'User Guide' },
    { value: 'technical', label: 'Technical' },
  ];

  // ELECTRON-OPTIMIZED PDF GENERATION
  const downloadPDF = async (docId: string) => {
    try {
      const doc = documentationSections.find(d => d.id === docId);
      if (!doc) {
        alert('Document not found');
        return;
      }      // Create optimized HTML content for PDF
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${doc.title} - TallySyncPro Documentation</title>
    <meta charset="UTF-8">
    <style>
        @page { margin: 1in; size: A4; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: white;
        }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .header h1 { color: #2563eb; font-size: 28px; margin: 0 0 10px 0; }
        .header h2 { color: #1e40af; font-size: 20px; margin: 0 0 10px 0; }
        .date { color: #666; font-size: 14px; }
        .content h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; }
        .content h2 { color: #1e40af; margin-top: 25px; margin-bottom: 15px; }
        .content h3 { color: #1e3a8a; margin-top: 20px; margin-bottom: 10px; }
        .content p { margin-bottom: 12px; text-align: justify; }
        .content ul, .content ol { margin: 10px 0; padding-left: 25px; }
        .content li { margin-bottom: 5px; }
        .content code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
        .content pre { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; overflow-x: auto; margin: 15px 0; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .controls { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 15px; margin-bottom: 20px; text-align: center; }
        .btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; font-size: 14px; }
        .btn:hover { background: #1d4ed8; }
        .btn-danger { background: #dc2626; }
        .btn-danger:hover { background: #b91c1c; }
    </style>
</head>
<body>
    <div class="controls">
        <p><strong>📄 Save this document as PDF</strong></p>
        <button class="btn" onclick="window.print()">🖨️ Print/Save as PDF</button>
        <button class="btn btn-danger" onclick="window.close()">❌ Close</button>
    </div>
    
    <div class="header">
        <h1>TallySyncPro Documentation</h1>
        <h2>${doc.title}</h2>
        <div class="date">Generated: ${new Date().toLocaleDateString()}</div>
    </div>
    
    <div class="content">
        ${renderMarkdown(doc.content)}
    </div>
    
    <div class="footer">
        <p><strong>TallySyncPro</strong> - Professional Tally ERP Integration</p>
        <p>© 2025 Digidenone. All rights reserved.</p>
        <p>Document: ${docId} | Generated: ${new Date().toISOString()}</p>
    </div>

    <script>
        window.onload = function() {
            window.focus();
            console.log('PDF viewer ready. Press Ctrl+P to print/save as PDF');
        };
        
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
            if (e.key === 'Escape') {
                window.close();
            }
        });
    </script>
</body>
</html>`;

      // For Electron app: Create a new window
      const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
      
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        newWindow.focus();
        console.log(`📄 PDF viewer opened for: ${doc.title}`);
        
        // Show user instructions
        setTimeout(() => {
          alert('PDF viewer opened! In the new window:\\n\\n1. Click "Print/Save as PDF" button\\n2. Or press Ctrl+P\\n3. Choose "Save as PDF" as destination\\n4. Select your download location and save');
        }, 1000);
      } else {
        // Fallback for Electron: Use current window
        const printDiv = document.createElement('div');
        printDiv.innerHTML = htmlContent;
        printDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:9999;overflow:auto;';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '❌ Close';
        closeBtn.style.cssText = 'position:absolute;top:20px;right:20px;padding:10px;background:#dc2626;color:white;border:none;border-radius:5px;cursor:pointer;z-index:10000;';
        closeBtn.onclick = () => document.body.removeChild(printDiv);
        
        printDiv.appendChild(closeBtn);
        document.body.appendChild(printDiv);
        
        console.log(`📄 PDF viewer displayed for: ${doc.title}`);
      }
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          Comprehensive guides and documentation for TallySyncPro
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
                    Read More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocumentationViewer;
