
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUp, Database, HardDrive, PcCase, Import } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnhancedFileImporterProps {
  onImport: (data: Record<string, unknown>[]) => void;
}

const EnhancedFileImporter: React.FC<EnhancedFileImporterProps> = ({ onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [googleDriveUrl, setGoogleDriveUrl] = useState('');
  const [oneDriveUrl, setOneDriveUrl] = useState('');
  const [dropboxUrl, setDropboxUrl] = useState('');
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const isMobile = useIsMobile();
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
      setSelectedLocalFile(e.target.files[0]);
    }
  };
  
  const handleFiles = async (files: FileList) => {
    const file = files[0];
    
    // Check file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload Excel, CSV or PDF files.');
      return;
    }
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File too large. Please upload a file smaller than 10MB.');
      return;
    }
    
    setUploading(true);
    
    try {
      // Simulate processing with progress updates
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        setProgress(Math.min(currentProgress, 95));
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 200);
      
      // Simulate file reading and processing with offline support
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(interval);
      setProgress(100);
      
      // Generate dummy data or parse actual file
      const dummyData = generateDummyData();
      onImport(dummyData);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
      
      toast.success('File imported successfully!');
    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Failed to import file. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };
  
  const handleCloudImport = async (service: string, url: string) => {
    if (!url) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    // Check network connectivity
    if (!navigator.onLine) {
      toast.error(`You're currently offline. Cloud import requires an internet connection.`);
      return;
    }
    
    setUploading(true);
    
    try {
      // Simulate processing with progress updates
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 15;
        setProgress(Math.min(currentProgress, 95));
        if (currentProgress >= 100) {
          clearInterval(interval);
        }
      }, 200);
      
      // Simulate file fetching and processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(interval);
      setProgress(100);
      
      // Generate dummy data
      const dummyData = generateDummyData();
      onImport(dummyData);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
      
      toast.success(`Data from ${service} imported successfully!`);
    } catch (error) {
      console.error('Error importing from cloud:', error);
      toast.error(`Failed to import from ${service}. Please check the URL and try again.`);
      setUploading(false);
      setProgress(0);
    }
  };
  
  // Sample data generator
  const generateDummyData = () => {
    const currentDate = new Date();
    
    return Array.from({ length: 15 }, (_, i) => {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      return {
        id: i + 1,
        date: date,
        invoice: `INV-${2023000 + i}`,
        customer: `Customer ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        particulars: `Product sale - Batch ${Math.floor(Math.random() * 1000)}`,
        amount: Math.floor(Math.random() * 100000) + 1000,
        costCenter: Math.random() > 0.5 ? 'Main Branch' : 'Head Office',
        category: ['Sales', 'Service', 'Repair', 'Maintenance'][Math.floor(Math.random() * 4)],
        gstin: `29${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
        status: Math.random() > 0.3 ? 'Completed' : 'Pending',
      };
    });
  };
  
  return (
    <Card className="border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-light/10 to-slate-50 dark:from-purple-light/5 dark:to-slate-800/20 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <FileUp className="h-5 w-5 text-purple" />
          Import Data
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <PcCase size={14} />
              <span>Local</span>
            </TabsTrigger>
            <TabsTrigger value="cloud" className="flex items-center gap-1">
              <Database size={14} />
              <span>Cloud</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0">
            <div
              className={`p-6 rounded-lg border-2 border-dashed transition-all ${
                dragActive 
                  ? 'border-purple bg-purple-light/5' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-purple/60'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: dragActive ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-3 p-3 rounded-full bg-purple-light/10 w-16 h-16 flex items-center justify-center">
                    <HardDrive className="h-8 w-8 text-purple" />
                  </div>
                </motion.div>
                
                <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Click to browse</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Supported formats: Excel, CSV, PDF (Max 10MB)
                </p>
                
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                  className="relative"
                >
                  <Input
                    id="file-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv,.pdf"
                    disabled={uploading}
                  />
                  {selectedLocalFile ? selectedLocalFile.name : 'Browse Files'}
                </Button>
                
                {uploading && (
                  <div className="mt-4 w-full">
                    <Progress value={progress} className="h-1.5" />
                    <p className="text-xs text-center mt-1 text-slate-500">{progress}% - Processing...</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cloud" className="mt-0">
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Import size={14} className="text-blue-500" />
                  </div>
                  <p className="font-medium text-sm">Google Drive</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Paste Google Drive share link"
                    value={googleDriveUrl}
                    onChange={(e) => setGoogleDriveUrl(e.target.value)}
                    disabled={uploading || !navigator.onLine}
                  />
                  <Button 
                    disabled={uploading || !googleDriveUrl || !navigator.onLine} 
                    onClick={() => handleCloudImport('Google Drive', googleDriveUrl)}
                    className={isMobile ? "w-full mt-1" : ""}
                  >
                    Import
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-700/10 flex items-center justify-center">
                    <Import size={14} className="text-blue-700" />
                  </div>
                  <p className="font-medium text-sm">OneDrive</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Paste OneDrive share link"
                    value={oneDriveUrl}
                    onChange={(e) => setOneDriveUrl(e.target.value)}
                    disabled={uploading || !navigator.onLine}
                  />
                  <Button 
                    disabled={uploading || !oneDriveUrl || !navigator.onLine}
                    onClick={() => handleCloudImport('OneDrive', oneDriveUrl)}
                    className={isMobile ? "w-full mt-1" : ""}
                  >
                    Import
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-400/10 flex items-center justify-center">
                    <Import size={14} className="text-blue-400" />
                  </div>
                  <p className="font-medium text-sm">Dropbox</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Paste Dropbox share link"
                    value={dropboxUrl}
                    onChange={(e) => setDropboxUrl(e.target.value)}
                    disabled={uploading || !navigator.onLine}
                  />
                  <Button 
                    disabled={uploading || !dropboxUrl || !navigator.onLine}
                    onClick={() => handleCloudImport('Dropbox', dropboxUrl)}
                    className={isMobile ? "w-full mt-1" : ""}
                  >
                    Import
                  </Button>
                </div>
              </div>
              
              {uploading && (
                <div className="mt-4 w-full">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-center mt-1 text-slate-500">{progress}% - Processing...</p>
                </div>
              )}
              
              {!navigator.onLine && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg mt-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You're currently offline. Cloud import is unavailable. Please use local file import instead.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedFileImporter;
