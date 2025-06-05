/**
 * TallyGuide Page Component
 * 
 * Standalone page for the comprehensive Tally ERP/Prime ODBC connection setup guide.
 * This page provides a dedicated interface for users to configure their Tally software
 * for integration with TallySync Pro.
 * 
 * Features:
 * - Full-screen dedicated guide interface
 * - Navigation breadcrumbs
 * - Enhanced TallyConnectionGuide component
 * - Responsive design for all devices
 * 
 * @version 1.0.0
 * @author Digidenone
 * @license MIT
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import TallyConnectionGuide from '@/components/guides/TallyConnectionGuide';
import MobileWarning from '@/components/MobileWarning';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

/**
 * TallyGuide Page Component
 * 
 * Provides a dedicated page for the Tally ODBC connection setup guide.
 * 
 * @returns {JSX.Element} The complete Tally guide page
 */
const TallyGuide: React.FC = () => {
  const navigate = useNavigate();
  const handleGuideComplete = () => {
    navigate('/data-entry');
  };

  const handleGoBack = () => {
    navigate(-1);
  };
  return (
    <AppLayout>
      <MobileWarning />
      <div className="container-desktop-only spacing-desktop-section">        {/* Page Header */}
        <div className="space-y-4">
          {/* Page Title */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-desktop-xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
                Tally Connection Setup Guide
              </h1>              <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                Complete step-by-step instructions to configure Tally ERP 9 
                for seamless integration with TallySync Pro. Follow the guide to enable 
                ODBC connectivity and establish a secure connection.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>

        {/* Guide Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <TallyConnectionGuide onClose={handleGuideComplete} />
        </div>

        {/* Footer Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Need Additional Help?
              </h3>              <p className="text-blue-700 dark:text-blue-300 mb-4">
                If you encounter any issues during the setup process, our support team is here to help.
                You can also access our comprehensive setup documentation.
              </p>              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/support')}
                  className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  Contact Support
                </Button>                <Button
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  Configure Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TallyGuide;
