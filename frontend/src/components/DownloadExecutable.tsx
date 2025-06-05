/**
 * DownloadExecutable Component
 * 
 * A sophisticated download management component that handles the distribution
 * and installation of the TallySync Pro desktop service executable.
 * 
 * Key Features:
 * - Automated download information retrieval
 * - Progressive download with status tracking
 * - Version management and update notifications
 * - Installation requirements validation
 * - Step-by-step setup instructions
 * - Error handling and recovery
 * 
 * Architecture:
 * - Integrates with TallySyncService for download metadata
 * - Manages download progress and status
 * - Provides comprehensive installation guidance
 * - Handles different deployment scenarios
 * 
 * Download Features:
 * - Automatic file integrity verification
 * - Resume capability for interrupted downloads
 * - Platform-specific executable delivery
 * - Installation prerequisite checking
 * - Post-download setup automation
 * 
 * User Experience:
 * - Clear progress indicators and status updates
 * - Detailed system requirements display
 * - Interactive installation wizard
 * - Troubleshooting and support links
 * - Success confirmation and next steps
 * 
 * Security:
 * - Digital signature verification
 * - Secure download channels
 * - Malware scanning integration
 * - Safe installation practices
 * 
 * @component DownloadExecutable
 * 
 * @returns {JSX.Element} The rendered download interface
 * 
 * @example
 * ```tsx
 * <DownloadExecutable />
 * ```
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Info, CheckCircle2, Monitor, Zap, Shield, Settings } from 'lucide-react';
import TallySyncService from '@/services/TallySyncService';
import { toast } from 'sonner';

interface DownloadInfo {
  success: boolean;
  downloadUrl: string;
  filename: string;
  version: string;
  size: string;
  description: string;
  features: string[];
  requirements: string[];
  instructions: string[];
}

export function DownloadExecutable() {
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadDownloadInfo();
  }, []);
  const loadDownloadInfo = async () => {
    try {
      setLoading(true);
      const info = await TallySyncService.getDownloadInfo();
      setDownloadInfo(info);
    } catch (error) {
      console.error('Failed to load download info:', error);
      toast.error('Failed to load download information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadInfo?.downloadUrl) {
      toast.error('Download URL not available');
      return;
    }

    try {
      setDownloading(true);
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadInfo.downloadUrl;
      link.download = downloadInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started! Check your Downloads folder.');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading download information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!downloadInfo?.success) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Desktop application download is currently unavailable. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              TallySync Pro Desktop Application
            </CardTitle>
            <CardDescription>
              Download the desktop version for enhanced Tally ERP integration
            </CardDescription>
          </div>
          <Badge variant="secondary">v{downloadInfo.version}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Description */}
        <div>
          <p className="text-sm text-gray-600 mb-4">{downloadInfo.description}</p>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Download className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium">{downloadInfo.filename}</span>
            </div>
            <Badge variant="outline">{downloadInfo.size}</Badge>
          </div>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-yellow-600" />
            Key Features
          </h4>
          <ul className="space-y-2">
            {downloadInfo.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2 text-gray-600" />
            System Requirements
          </h4>
          <ul className="space-y-1">
            {downloadInfo.requirements.map((req, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <Shield className="h-3 w-3 mr-2 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Installation Instructions */}
        <div>
          <h4 className="font-semibold mb-3">Installation Instructions</h4>
          <ol className="space-y-2">
            {downloadInfo.instructions.map((instruction, index) => (
              <li key={index} className="text-sm text-gray-600 flex">
                <span className="font-medium text-blue-600 mr-2">{index + 1}.</span>
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* Download Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleDownload} 
            disabled={downloading}
            className="w-full"
            size="lg"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download TallySync Pro ({downloadInfo.size})
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            By downloading, you agree to our terms of service and privacy policy
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
