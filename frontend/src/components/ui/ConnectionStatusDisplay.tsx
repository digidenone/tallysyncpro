import React, { useState, useEffect } from 'react';
// Add global type for Electron preload API
declare global {
  interface Window {
    tallyAPI: {
      testConnection: (config: any) => Promise<{ success: boolean; connected: boolean; error?: string }>;
    };
  }
}

import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Progress } from './progress';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import NotificationService from '../../services/NotificationService';

export interface ConnectionStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
}

interface ConnectionStatusDisplayProps {
  onTestConnection?: () => Promise<void>;
  className?: string;
}

export const ConnectionStatusDisplay: React.FC<ConnectionStatusDisplayProps> = ({
  onTestConnection,
  className = ''
}) => {
  const [steps, setSteps] = useState<ConnectionStep[]>([    {
      id: 'service-tally',
      label: 'TallySyncPro Service ↔ Tally',
      description: 'Direct connection to Tally ERP 9 with integrated service...',
      status: 'pending'
    },
    {
      id: 'system-ready',
      label: 'System Ready',
      description: 'All systems operational and ready for data sync',
      status: 'pending'
    }
  ]);

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const getStatusIcon = (status: ConnectionStep['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ConnectionStep['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateStepStatus = (stepId: string, status: ConnectionStep['status'], errorMessage?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, errorMessage }
        : step
    ));
  };
  // Test direct connectivity to Tally through integrated service
  const testTallyServiceConnection = async (): Promise<boolean> => {
    updateStepStatus('service-tally', 'connecting');

    try {
      // Use Electron preload IPC bridge
      const result = await window.tallyAPI.testConnection({ host: 'localhost', port: 9000 });

      if (!result || !result.connected) {
        throw new Error(result?.error || 'Not connected');
      }

      updateStepStatus('service-tally', 'connected');
      NotificationService.connectionSuccess('tally', 'Connected to Tally ERP 9');
      return true;

    } catch (error) {
      const errorMsg = 'Tally ERP connection is not active. Please check Tally is open and ODBC/Port 9000 is enabled.';
      updateStepStatus('service-tally', 'error', errorMsg);
      NotificationService.connectionError('tally', errorMsg);
      return false;
    }
  };

  const runConnectionTest = async () => {
    if (isTestingConnection) return;
    
    setIsTestingConnection(true);
    setOverallProgress(0);
    
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, errorMessage: undefined })));
    
    try {
      setOverallProgress(25);
      const tallyConnected = await testTallyServiceConnection();
      
      if (tallyConnected) {
        setOverallProgress(75);
        updateStepStatus('system-ready', 'connected');
        setOverallProgress(100);
        
        NotificationService.success('🎉 TallySync Pro Ready', {
          description: 'Direct connection to Tally established successfully. You can now import and sync data.',
          duration: 5000
        });
        
        if (onTestConnection) {
          await onTestConnection();
        }
      } else {
        setOverallProgress(0);
        updateStepStatus('system-ready', 'error', 'System not ready due to connection failures');
          NotificationService.error('Connection Test Failed', {
          description: 'Please ensure TallySyncPro Service is running and Tally ERP 9 is open with ODBC enabled'
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      updateStepStatus('system-ready', 'error', 'Unexpected error during connection test');
      
      NotificationService.error('Connection Test Error', {
        description: 'An unexpected error occurred during the connection test'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  useEffect(() => {
    const initialTimer = setTimeout(runConnectionTest, 1500); 
    
    const intervalTimer = setInterval(() => {
      if (steps.some(step => step.status === 'error' || step.status === 'pending')) {
        runConnectionTest();
      }
    }, 10000);

    // Listen for tray-triggered custom event
    const trayHandler = () => { runConnectionTest(); };
    window.addEventListener('test-tally-connection' as any, trayHandler as any);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('test-tally-connection' as any, trayHandler as any);
    };
  }, []);

  const connectedSteps = steps.filter(step => step.status === 'connected').length;
  const hasErrors = steps.some(step => step.status === 'error');

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-responsive-lg font-semibold">
            Connection Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {connectedSteps === steps.length ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : hasErrors ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400" />
            )}
            <Badge 
              variant="outline" 
              className={`text-sm ${
                connectedSteps === steps.length 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : hasErrors 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-gray-300'
              }`}
            >
              {connectedSteps}/{steps.length} Connected
            </Badge>
          </div>
        </div>
        
        {isTestingConnection && (
          <div className="mt-2">
            <Progress value={overallProgress} className="h-2" />
            <p className="text-sm text-gray-600 mt-1">Testing connections...</p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(step.status)}`}
          >
            {getStatusIcon(step.status)}
            <div className="flex-1">
              <div className="font-medium">{step.label}</div>
              <div className="text-sm opacity-80">{step.description}</div>
              {step.errorMessage && (
                <div className="text-sm text-red-600 mt-1">{step.errorMessage}</div>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={runConnectionTest}
            disabled={isTestingConnection}
            className="flex-1"
            variant={hasErrors ? "destructive" : "default"}
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {hasErrors ? 'Retry Connection' : 'Test Connection'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusDisplay;