/**
 * Mobile Warning Component
 * 
 * Displays a warning message to users accessing the application from mobile
 * or non-desktop devices, recommending desktop usage for optimal experience.
 * 
 * FEATURES:
 * - Automatic device detection
 * - Responsive warning overlay
 * - Dismissible notification
 * - Professional styling
 * - Local storage memory for dismissal
 * 
 * @component MobileWarning
 * @author Digidenone
 * @version 1.0.0
 * @since 2024
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Monitor, Smartphone } from 'lucide-react';

const MobileWarning = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    // Detect mobile device
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 1024; // Less than desktop breakpoint
      const isTouchDevice = 'ontouchstart' in window;
      
      return isMobileDevice || (isSmallScreen && isTouchDevice);
    };

    const mobile = checkIfMobile();
    setIsMobile(mobile);
    
    // Always show warning if mobile - no longer storing dismissal in localStorage
    if (mobile) {
      setIsVisible(true);
    }
  }, []);

  const dismissWarning = () => {
    setIsVisible(false);
    localStorage.setItem('mobileWarningDismissed', 'true');
  };

  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <Monitor className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Desktop Recommended
              </h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={dismissWarning}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-6">
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <Smartphone className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>TallySync Pro</strong> is optimized for desktop use. For the best experience with data entry, 
                file uploads, and Tally integration, please access this application from a desktop computer.
              </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Full Excel file processing capabilities</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Optimized keyboard shortcuts and navigation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Better integration with Tally ERP desktop service</span>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button 
              onClick={dismissWarning}
              className="flex-1"
              variant="outline"
            >
              Continue Anyway
            </Button>
            <Button 
              onClick={() => window.close()}
              className="flex-1"
            >
              Switch to Desktop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileWarning;
