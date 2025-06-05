/**
 * TallyConnectionGuide Component
 * 
 * Interactive step-by-step guide for configuring Tally ERP 9 
 * ODBC server and enabling data connectivity for TallySync Pro.
 * 
 * FEATURES:
 * - Visual step-by-step instructions
 * - Version-specific guidance (Tally ERP 9 focused)
 * - Screenshots and diagrams
 * - Configuration validation
 * - Troubleshooting tips
 * - Progress tracking
 * 
 * CONFIGURATION STEPS:
 * 1. Enable Gateway of Tally
 * 2. Configure ODBC Server
 * 3. Set up Data Server
 * 4. Configure Company Database
 * 5. Test Connection
 * 
 * @component TallyConnectionGuide
 * @version 1.0.0
 * @author TallySync Pro Team - Digidenone
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle2, 
  Circle, 
  Database, 
  Network, 
  Settings, 
  Download,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Play,
  Square
} from 'lucide-react';

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  screenshot?: string;
  tips?: string[];
  completed: boolean;
}

interface TallyConnectionGuideProps {
  onClose?: () => void;
  onConnectionTest?: () => Promise<boolean>;
  className?: string;
}

export const TallyConnectionGuide: React.FC<TallyConnectionGuideProps> = ({
  onClose,
  onConnectionTest,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isTestingConnection, setIsTestingConnection] = useState(false);const erp9Steps: GuideStep[] = [
    {
      id: 'gateway-enable-erp9',
      title: 'Enable Gateway Features',
      description: 'Configure Tally ERP 9 for external connections',
      instructions: [
        'Open Tally ERP 9 software',
        'Press F11 from the Gateway of Tally',
        'Go to "Advanced Configuration"',
        'Navigate to "Data Configuration"',
        'Set "Data Server" = Yes',
        'Configure "Data Server Port" = 9000',
        'Enable "ODBC Server" = Yes',
        'Set "ODBC Server Port" = 9988',
        'Accept and save configuration'
      ],
      tips: [
        'Ensure you have admin rights in Tally'
      ],
      completed: false
    },
    {
      id: 'company-setup-erp9',
      title: 'Company Configuration',
      description: 'Set up company database for external access',
      instructions: [
        'Load your company in Tally ERP 9',
        'Press F11 from company screen',
        'Go to "Security Control"',
        'Enable "Use Security Control" if not already enabled',
        'Create or modify user with data access rights',
        'Ensure "Allow Data Export" is enabled',
        'Save configuration and reload company'
      ],
      tips: [
        'Security control is crucial for ERP 9',
        'Create separate user for TallySync Pro access',
        'Document login credentials securely'
      ],
      completed: false
    },
    {
      id: 'odbc-driver-erp9',
      title: 'ODBC Driver Installation',
      description: 'Install compatible ODBC driver for ERP 9',
      instructions: [
        'Download Tally ERP 9 ODBC Driver',
        'Ensure compatibility with your ERP 9 version',
        'Run installer with administrator privileges',
        'Complete installation wizard',
        'Restart system if prompted',
        'Verify in Windows ODBC Administrator'      ],
      tips: [
        'Check Tally website for latest driver versions',
        'Some older versions may require legacy drivers'
      ],
      completed: false
    },
    {
      id: 'network-config-erp9',
      title: 'Network Configuration',
      description: 'Configure network settings for connectivity',
      instructions: [
        'Open Windows Firewall settings',
        'Add Tally ERP 9 to firewall exceptions',
        'Allow ports 9000 and 9988 for inbound connections',
        'If using network installation, configure server settings',
        'Test local connectivity first',
        'Verify network adapter settings'
      ],
      tips: [
        'Network installations require additional configuration',
        'Server-based ERP 9 needs server-side setup',
        'Test locally before configuring network access'
      ],
      completed: false
    },
    {
      id: 'connection-test-erp9',
      title: 'Connection Validation',
      description: 'Test and validate Tally ERP 9 connectivity',
      instructions: [
        'Start Tally ERP 9 with company loaded',
        'Use connection test feature below',
        'Monitor connection status',
        'Verify data access permissions',
        'Test basic data retrieval'
      ],
      tips: [
        'ERP 9 may take longer to establish connections',
        'Ensure company is fully loaded before testing',
        'Check Tally logs for connection attempts'
      ],
      completed: false
    }
  ];

  const currentSteps = erp9Steps;

  const markStepCompleted = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const success = onConnectionTest ? await onConnectionTest() : false;
      if (success) {
        markStepCompleted('connection-test');
        markStepCompleted('connection-test-erp9');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const isStepCompleted = (stepId: string) => completedSteps.has(stepId);
  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Tally ERP 9 Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Tally ERP 9 Configuration Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>TallySyncPro for Tally ERP 9</strong> - This guide provides step-by-step instructions 
              for configuring Tally ERP 9 to work with the integrated TallySyncPro desktop application.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Steps
            </span>
            <Badge variant="outline">
              Step {currentStep + 1} of {currentSteps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / currentSteps.length) * 100}%` }}
            />
          </div>

          {/* Current Step */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {isStepCompleted(currentSteps[currentStep].id) ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <h3 className="text-xl font-semibold">
                  {currentSteps[currentStep].title}
                </h3>
                <p className="text-gray-600">
                  {currentSteps[currentStep].description}
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Instructions:</h4>
              <ol className="space-y-2">
                {currentSteps[currentStep].instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {currentSteps[currentStep].tips && (              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Pro Tips:
                </h4>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {currentSteps[currentStep].tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Connection Test for Final Step */}
            {currentSteps[currentStep].id.includes('connection-test') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-blue-800">Test Connection</h4>
                <p className="text-sm text-blue-700">
                  Click the button below to test if TallySync Pro can successfully connect to your Tally installation.
                </p>
                <Button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="w-full sm:w-auto"
                >
                  {isTestingConnection ? (
                    <>
                      <Square className="h-4 w-4 mr-2 animate-pulse" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => markStepCompleted(currentSteps[currentStep].id)}
                disabled={isStepCompleted(currentSteps[currentStep].id)}
              >
                {isStepCompleted(currentSteps[currentStep].id) ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>

              <Button
                onClick={() => setCurrentStep(Math.min(currentSteps.length - 1, currentStep + 1))}
                disabled={currentStep === currentSteps.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Default Ports:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Data Server: 9000</li>
                <li>• ODBC Server: 9988</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Important Files:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• tally.exe (main application)</li>
                <li>• tally.ini (configuration)</li>
              </ul>            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TallyConnectionGuide;
