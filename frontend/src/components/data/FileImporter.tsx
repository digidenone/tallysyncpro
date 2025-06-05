
import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, FileSearch, File, X, FileType, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface FileImporterProps {
  onImport: (data: any) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
  className?: string;
}

const FileImporter: React.FC<FileImporterProps> = ({
  onImport,
  acceptedFileTypes = '.xlsx,.xls,.csv,.pdf',
  maxFileSize = 10, // 10MB default
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validTypes = acceptedFileTypes.split(',').map(type => type.replace('.', '').toLowerCase());
    
    if (!fileExtension || !validTypes.includes(fileExtension)) {
      toast.error(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
      return false;
    }
    
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`File is too large. Maximum size: ${maxFileSize}MB`);
      return false;
    }
    
    return true;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-full w-full" />;
      case 'csv':
        return <FileType className="h-full w-full" />;
      case 'pdf':
        return <FileText className="h-full w-full" />; // Changed from FilePdf to FileText
      default:
        return <File className="h-full w-full" />;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    
    // Create file preview for certain file types
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
    
    toast.success(`File "${file.name}" selected`, {
      description: "Click 'Import Data' to continue",
    });
  };

  const processFile = () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    // Simulate processing with progress updates
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 20;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Simulate data processing after upload completes
          setTimeout(() => {
            // Simulated data from file
            const mockData = [
              { id: 1, date: '2023-05-13', amount: 1500, description: 'Invoice #1001', customer: 'Acme Corp', particulars: 'Services', invoice: 'INV-1001', costCenter: 'Sales', category: 'Income', gstin: 'GSTIN001', status: 'Pending' },
              { id: 2, date: '2023-05-14', amount: 2200, description: 'Invoice #1002', customer: 'TechStart Inc', particulars: 'Subscription', invoice: 'INV-1002', costCenter: 'Marketing', category: 'Income', gstin: 'GSTIN002', status: 'Completed' },
              { id: 3, date: '2023-05-15', amount: 900, description: 'Invoice #1003', customer: 'Global Solutions', particulars: 'Consulting', invoice: 'INV-1003', costCenter: 'Operations', category: 'Income', gstin: 'GSTIN003', status: 'Pending' },
            ];
            
            onImport(mockData);
            
            setIsProcessing(false);
            toast.success(`File "${selectedFile.name}" imported successfully`, {
              description: "Data is now ready for Tally export",
            });
            setSelectedFile(null);
            setUploadProgress(0);
            setFilePreview(null);
          }, 500);
        }
        return newProgress;
      });
    }, 300);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Animation variants
  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24,
        duration: 0.3
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className={cn("glass-card p-4 sm:p-6", className)}
      initial="hidden"
      animate="visible"
      variants={fadeInUpVariants}
    >
      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-4 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">Import Data</h3>
      
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div 
            key="dropzone"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors overflow-hidden relative",
              isDragging 
                ? "border-purple bg-purple/10" 
                : "border-slate-200 dark:border-slate-700 hover:border-purple/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              background: isDragging 
                ? 'linear-gradient(120deg, rgba(139,92,246,0.05) 0%, rgba(139,92,246,0.1) 100%)' 
                : undefined
            }}
          >
            <motion.div 
              className="relative z-10"
              variants={fadeInUpVariants}
            >
              <motion.div 
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="h-8 w-8 text-purple" />
              </motion.div>
              
              <motion.h4 
                className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300"
                variants={fadeInUpVariants}
              >
                Drag and drop your file here
              </motion.h4>
              
              <motion.p 
                className="mb-4 text-xs text-slate-500 dark:text-slate-400"
                variants={fadeInUpVariants}
              >
                Supported formats: Excel, CSV, PDF
              </motion.p>
              
              <motion.div variants={fadeInUpVariants}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <FileSearch className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept={acceptedFileTypes}
                  onChange={handleFileSelect}
                />
              </motion.div>
            </motion.div>
            
            {/* Animated background elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-purple/5"
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -10, 0],
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute bottom-1/3 right-1/3 w-20 h-20 rounded-full bg-teal-light/5"
                animate={{ 
                  x: [0, -15, 0],
                  y: [0, 15, 0],
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 5,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="filePreview"
            className="animate-fade-in"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <motion.div 
              className="mb-4 p-4 rounded-xl neo-card bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center w-full sm:w-auto">
                <div className="mr-4 h-12 w-12 rounded-lg overflow-hidden bg-purple/10 text-purple flex items-center justify-center">
                  {filePreview ? (
                    <img 
                      src={filePreview} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 text-purple">
                      {getFileIcon(selectedFile.name)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">
                    {selectedFile.name}
                  </p>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="shrink-0">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span className="mx-1">•</span>
                    <span className="uppercase">{selectedFile.name.split('.').pop()}</span>
                  </div>
                </div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
            
            {isProcessing && (
              <motion.div 
                className="mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Processing file...</span>
                  <span className="font-medium text-purple">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                
                <div className="mt-3 flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Don't close this window while processing</span>
                </div>
              </motion.div>
            )}
            
            <motion.div 
              className="flex justify-end space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={removeFile}
                disabled={isProcessing}
                className="bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={processFile}
                disabled={isProcessing}
                className="bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white shadow-md hover:shadow-lg transition-all group"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <motion.div
                      className="mr-2 flex items-center"
                      whileHover={{ scale: 1.1 }}
                    >
                      <Upload className="h-4 w-4" />
                    </motion.div>
                    Import Data
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileImporter;
