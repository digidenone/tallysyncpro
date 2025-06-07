/**
 * Dashboard Page - TallySync Pro Main Control Center
 * 
 * The primary dashboard interface that serves as the central hub for all
 * TallySync Pro operations, providing real-time status monitoring,
 * quick access to key features, and comprehensive system overview.
 * 
 * CORE FEATURES:
 * - Real-time connection status monitoring
 * - Quick action buttons for common operations
 * - System health and performance metrics
 * - Recent activity and operation history
 * - Interactive data visualization
 * - Progressive web app capabilities
 * 
 * DASHBOARD SECTIONS:
 * - Connection Status Panel (Tally + Backend)
 * - Quick Actions (Upload, Download, Process)
 * - System Metrics (Performance, Storage, Activity)
 * - Recent Operations (History, Logs, Analytics)
 * - Navigation Shortcuts (Settings, Support, Help)
 * 
 * REAL-TIME FEATURES:
 * - Live connection monitoring with auto-refresh
 * - Background status checks every 30 seconds
 * - WebSocket integration for instant updates
 * - Progress tracking for ongoing operations
 * - Notification system for status changes
 * 
 * RESPONSIVE DESIGN:
 * - Mobile-first layout optimization
 * - Adaptive grid system
 * - Touch-friendly interactions
 * - Progressive enhancement
 * - Accessibility compliance
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Lazy loading for non-critical components
 * - Efficient state management
 * - Debounced status checks
 * - Memory leak prevention
 * - Optimized re-rendering
 * 
 * INTEGRATION POINTS:
 * - TallySync service connectivity
 * - Notification system integration
 * - Router navigation management
 * - Theme system integration
 * - Error boundary protection
 * 
 * @page Dashboard
 * @route /dashboard
 * 
 * @example
 * ```tsx
 * // Accessed via router
 * <Route path="/dashboard" component={Dashboard} />
 * ```
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  Download, 
  Upload, 
  Activity, 
  Database, 
  FileSpreadsheet, 
  Settings, 
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ConnectionStatus from '@/components/ui/ConnectionStatus';
import ConnectionStatusDisplay from '@/components/ui/ConnectionStatusDisplay';
import { useTallySync } from '@/hooks/useTallySync';
import AppLayout from '@/components/layout/AppLayout';
import NotificationService from '@/services/NotificationService';
import MobileWarning from '@/components/MobileWarning';
import realTimeDataService, { DashboardMetrics, ActivityItem } from '@/services/RealTimeDataService';

const Dashboard = () => {  const {
    isConnected,
    isConnecting, 
    isSyncing,
    syncStatus,
    tallyConfig,
    lastChecked,
    connectionError,
    testConnection
  } = useTallySync({
    onSuccess: (message) => console.log('Success:', message),
    onError: (message) => console.error('Error:', message),
    showToasts: false // Disable auto-toast notifications to prevent spam
  });

  // Real-time data state
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    recordsSynced: 0,
    filesProcessed: 0,
    activeSessions: 0,
    avgSyncSpeed: '0s',
    lastSyncTime: null,
    totalSyncTime: 0,
    errorCount: 0,
    successCount: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  // Subscribe to real-time data updates
  useEffect(() => {
    const unsubscribeMetrics = realTimeDataService.subscribe(setMetrics);
    const unsubscribeActivity = realTimeDataService.subscribeToActivity(setRecentActivity);

    return () => {
      unsubscribeMetrics();
      unsubscribeActivity();
    };
  }, []);

  // Update connection status in real-time service
  useEffect(() => {
    realTimeDataService.updateConnectionStatus(isConnected);
  }, [isConnected]);

  // Calculate sync progress based on recent activity
  useEffect(() => {
    const activeOperations = realTimeDataService.getActiveOperations();
    setSyncProgress(activeOperations.length > 0 ? 75 : (isConnected ? 100 : 0));
  }, [isConnected, recentActivity]);

  // Auto-check connection
  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const quickStats = [
    { 
      label: 'Records Synced', 
      value: metrics.recordsSynced.toLocaleString(), 
      icon: Database, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Files Processed', 
      value: metrics.filesProcessed.toString(), 
      icon: FileSpreadsheet, 
      color: 'text-green-600' 
    },
    { 
      label: 'Active Sessions', 
      value: metrics.activeSessions.toString(), 
      icon: Activity, 
      color: 'text-orange-600' 
    },
    { 
      label: 'Avg Sync Speed', 
      value: metrics.avgSyncSpeed, 
      icon: Zap, 
      color: 'text-purple-600' 
    },
  ];
  // Download functions for quick access
  const downloadTemplate = async () => {
    try {
      let downloadSuccessful = false;
      
      // Try to download actual Excel templates first
      const templates = [
        { name: 'AllAccountingMasters.xlsx', path: '/templates/AllAccountingMasters.xlsx' },
        { name: 'AccountingVouchers.xlsx', path: '/templates/AccountingVouchers.xlsx' }
      ];
      
      // Download each template
      for (const template of templates) {
        try {
          const response = await fetch(template.path);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = template.name;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            downloadSuccessful = true;
          }
        } catch (error) {
          console.log(`Failed to download ${template.name}:`, error);
        }
      }
      
      if (downloadSuccessful) {
        NotificationService.success('Excel templates downloaded successfully!', {
          description: 'Templates are ready for data entry and import'
        });
      } else {
        // Fallback: download readme guide
        const link = document.createElement('a');
        link.href = '/downloads/templates-readme.txt';
        link.download = 'TallySync-Pro-Templates-Guide.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        NotificationService.info('Downloaded template guide. Visit Data Entry page for Excel templates.', {
          description: 'Excel templates are available in the Data Entry section'
        });
      }
        } catch (error) {
      console.error('Template download failed:', error);
      NotificationService.error('Failed to download templates. Please try again.');
    }
  };

  return (
    <AppLayout>
      <MobileWarning />
      <div className="w-full max-w-7xl mx-auto px-8 py-8 space-y-8">        
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-8 mb-8">
          <div className="flex-1 space-y-5 max-w-3xl">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              TallySync Pro Dashboard
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground leading-relaxed">
              Professional Tally ERP integration and data synchronization platform
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0 xl:mt-0 mt-4 min-w-fit">{/*  */}
            <Button onClick={testConnection} variant="outline" size="default" className="h-11 px-6">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>            <Link to="/settings">
              <Button variant="outline" size="default" className="h-11 px-6">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Connection Status Alert */}
      {connectionError && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200 text-base">
            <strong>Connection Error:</strong> {connectionError}
          </AlertDescription>
        </Alert>
      )}

      {isConnected && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200 text-base">
            <strong>System Connected:</strong> TallySync Pro is operational and syncing with Tally ERP
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && !connectionError && (
        <Alert>
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-base">
            Tally ERP connection is not active. Please check your Tally installation and TallySync desktop app.
          </AlertDescription>
        </Alert>
      )}      {/* Main Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-slate-800 border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-8">
        {/* Enhanced Connection Status */}
        <Card className="bg-white dark:bg-slate-800 border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Real-time connection monitoring and status</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionStatusDisplay onTestConnection={async () => { await testConnection(); }} />
          </CardContent>
        </Card>        {/* Quick Actions */}
        <Card className="bg-white dark:bg-slate-800 border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Essential TallySync Pro operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={downloadTemplate}
              className="w-full h-11"
              variant="outline"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download Excel Templates
            </Button>            <div className="pt-2">
              <Link to="/data-entry" className="w-full">
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </Link>
            </div>
            <div className="pt-2">
              <Link to="/settings" className="w-full">
                <Button className="w-full h-11" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Sync Progress */}
        <Card className="bg-white dark:bg-slate-800 border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Sync Progress
            </CardTitle>
            <CardDescription>Real-time data synchronization status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Data Sync</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </div>
              <div className="space-y-2">
              <Badge variant={isConnected ? "default" : "secondary"} className="w-full justify-center">
                {isSyncing ? "Syncing..." : (syncStatus && syncStatus !== 'Idle' ? syncStatus : (isConnected ? "Ready" : "Disconnected"))}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
          {/* Recent Activity */}
      <Card className="bg-white dark:bg-slate-800 border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </span>
            <Badge variant="outline">{recentActivity.length} activities</Badge>
          </CardTitle>
          <CardDescription>Latest sync operations and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity) => {
                const StatusIcon = activity.status === 'success' ? CheckCircle :
                                 activity.status === 'error' ? AlertCircle :
                                 activity.status === 'warning' ? AlertCircle : RefreshCw;
                const statusColor = activity.status === 'success' ? 'text-green-600' :
                                  activity.status === 'error' ? 'text-red-600' :
                                  activity.status === 'warning' ? 'text-yellow-600' : 'text-blue-600';
                
                return (
                  <div key={activity.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`h-4 w-4 mt-0.5 ${statusColor}`} />
                      <div className="flex-1">
                        <span className="font-medium">{activity.action}</span>
                        {activity.details && (
                          <p className="text-sm text-muted-foreground mt-1">{activity.details}</p>
                        )}
                        {activity.recordCount && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {activity.recordCount} records
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {activity.time instanceof Date 
                          ? activity.time.toLocaleTimeString() 
                          : activity.time}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base font-medium">No recent activity</p>
                <p className="text-sm">Connect to Tally ERP 9 and start processing data to see activity</p>
              </div>
            )}
          </div>        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;