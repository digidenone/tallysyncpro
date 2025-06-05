/**
 * ================================================================
 * TallySyncPro - Enhanced Dashboard Component
 * ================================================================
 * 
 * Comprehensive dashboard that integrates with all backend services
 * and provides real-time monitoring, logging, and system status.
 * 
 * @author Digidenone Team
 * @version 1.0
 * @since 2025
 * 
 * ================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Download,
  RefreshCw,
  Settings,
  Bug,
  HardDrive
} from 'lucide-react';
import { useAPI, useDashboard, useRealTimeLogs, useTallySync } from '@/hooks/useAPI';
import { useToast } from '@/hooks/use-toast';

const EnhancedDashboard = () => {
  const api = useAPI();
  const { toast } = useToast();
  
  // Dashboard data
  const { 
    stats, 
    chartData, 
    recentActivities, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refresh: refreshDashboard 
  } = useDashboard();

  // Real-time logs
  const { 
    logs, 
    stats: logStats, 
    clearLogs, 
    exportLogs, 
    setLogLevel 
  } = useRealTimeLogs();

  // Tally sync status
  const { 
    syncStatus, 
    syncHistory, 
    testConnection, 
    startSync, 
    cancelSync 
  } = useTallySync();

  // Local state
  const [systemInfo, setSystemInfo] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedLogLevel, setSelectedLogLevel] = useState('info');

  /**
   * Load system information
   */
  const loadSystemInfo = useCallback(async () => {
    try {
      const [info, health] = await Promise.all([
        api.system.getInfo(),
        api.system.getHealth()
      ]);
      
      setSystemInfo(info);
      setSystemHealth(health);
      
    } catch (error) {
      console.error('Failed to load system info:', error);
      toast({
        title: "System Info Error",
        description: "Failed to load system information",
        variant: "destructive",
      });
    }
  }, [api, toast]);

  /**
   * Load service statuses
   */
  const loadServiceStatuses = useCallback(async () => {
    try {
      // Mock service status - in real app, this would come from service manager
      const serviceList = [
        { name: 'Database', status: 'running', uptime: '2h 15m' },
        { name: 'Excel Service', status: 'running', uptime: '2h 15m' },
        { name: 'Tally Service', status: 'running', uptime: '2h 15m' },
        { name: 'Logging Service', status: 'running', uptime: '2h 15m' },
        { name: 'Bug Report Service', status: 'running', uptime: '2h 15m' }
      ];
      
      setServices(serviceList);
      
    } catch (error) {
      console.error('Failed to load service statuses:', error);
    }
  }, []);

  /**
   * Handle log level change
   */
  const handleLogLevelChange = useCallback(async (level) => {
    try {
      await setLogLevel(level);
      setSelectedLogLevel(level);
      
      toast({
        title: "Log Level Updated",
        description: `Log level changed to ${level}`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update log level",
        variant: "destructive",
      });
    }
  }, [setLogLevel, toast]);

  /**
   * Handle log export
   */
  const handleExportLogs = useCallback(async () => {
    try {
      const result = await exportLogs({ 
        format: 'json',
        includeMetadata: true 
      });
      
      if (result.success) {
        toast({
          title: "Logs Exported",
          description: `Exported ${result.logCount} logs to ${result.filePath}`,
        });
      }
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export logs",
        variant: "destructive",
      });
    }
  }, [exportLogs, toast]);

  /**
   * Handle system cleanup
   */
  const handleSystemCleanup = useCallback(async () => {
    try {
      const result = await api.system.cleanup();
      
      toast({
        title: "Cleanup Completed",
        description: `Cleaned up ${result.filesDeleted || 0} files, freed ${result.spaceSaved || 0} bytes`,
      });
      
      // Refresh system info
      await loadSystemInfo();
      
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "System cleanup failed",
        variant: "destructive",
      });
    }
  }, [api, toast, loadSystemInfo]);

  /**
   * Generate bug report
   */
  const handleGenerateBugReport = useCallback(async () => {
    try {
      const description = "User-generated bug report from dashboard";
      const result = await api.system.generateBugReport(description);
      
      toast({
        title: "Bug Report Generated",
        description: `Bug report saved to ${result.filePath}`,
      });
      
    } catch (error) {
      toast({
        title: "Bug Report Failed",
        description: "Failed to generate bug report",
        variant: "destructive",
      });
    }
  }, [api, toast]);

  // Load initial data
  useEffect(() => {
    if (api.isConnected) {
      loadSystemInfo();
      loadServiceStatuses();
    }
  }, [api.isConnected, loadSystemInfo, loadServiceStatuses]);

  // Render status badge
  const renderStatusBadge = (status) => {
    const variant = status === 'running' ? 'default' : 
                   status === 'error' ? 'destructive' : 'secondary';
    const icon = status === 'running' ? CheckCircle : AlertCircle;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {React.createElement(icon, { size: 12 })}
        {status}
      </Badge>
    );
  };

  // Render log level badge
  const renderLogLevel = (level) => {
    const colors = {
      error: 'destructive',
      warn: 'secondary',
      info: 'default',
      debug: 'outline'
    };
    
    return (
      <Badge variant={colors[level] || 'outline'}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  if (!api.isConnected) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Unable to connect to backend services. Please check if the application is running properly.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health, services, and real-time activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshDashboard} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSystemCleanup} variant="outline" size="sm">
            <HardDrive className="h-4 w-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={handleGenerateBugReport} variant="outline" size="sm">
            <Bug className="h-4 w-4 mr-2" />
            Bug Report
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth?.status === 'healthy' ? (
                <span className="text-green-600">Healthy</span>
              ) : (
                <span className="text-yellow-600">Warning</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {services.length} services running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.successfulSyncs || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logStats?.totalLogs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {logStats?.errorCount || 0} errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastSyncTime ? 
                new Date(stats.lastSyncTime).toLocaleTimeString() : 
                'None'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {syncStatus?.status || 'Idle'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="logs">Real-time Logs</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest system operations and events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {recentActivities && recentActivities.length > 0 ? (
                    <div className="space-y-2">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{activity.operation}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                          {renderStatusBadge(activity.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No recent activities</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>
                          {((systemHealth.checks.memory.usage?.heapUsed || 0) / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                      <Progress 
                        value={systemHealth.checks.memory.usage ? 
                          (systemHealth.checks.memory.usage.heapUsed / systemHealth.checks.memory.usage.heapTotal) * 100 : 0
                        } 
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Services Health</span>
                        <span>{systemHealth.checks.services.running} Running</span>
                      </div>
                      <Progress value={95} />
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Loading health data...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Monitor all application services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    {renderStatusBadge(service.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Real-time Logs</span>
                <div className="flex gap-2">
                  <select 
                    value={selectedLogLevel} 
                    onChange={(e) => handleLogLevelChange(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                  <Button onClick={handleExportLogs} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button onClick={clearLogs} size="sm" variant="outline">
                    Clear
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Live application logs - Level: {selectedLogLevel.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {logs && logs.length > 0 ? (
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 p-2 hover:bg-muted rounded">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {renderLogLevel(log.level)}
                        <span className="text-muted-foreground">[{log.source}]</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No logs available</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Sync Status</CardTitle>
                <CardDescription>Active synchronization operations</CardDescription>
              </CardHeader>
              <CardContent>
                {syncStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      {renderStatusBadge(syncStatus.status)}
                    </div>
                    
                    {syncStatus.progress !== undefined && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{syncStatus.progress}%</span>
                        </div>
                        <Progress value={syncStatus.progress} />
                      </div>
                    )}
                    
                    {syncStatus.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Sync Error</AlertTitle>
                        <AlertDescription>{syncStatus.error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No active sync operation</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>Recent synchronization operations</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {syncHistory && syncHistory.length > 0 ? (
                    <div className="space-y-2">
                      {syncHistory.slice(0, 10).map((sync, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">
                              {sync.operation || 'Sync Operation'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sync.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {renderStatusBadge(sync.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">No sync history available</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Info</CardTitle>
              </CardHeader>
              <CardContent>
                {systemInfo ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-mono">{systemInfo.app?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-mono">{systemInfo.app?.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="font-mono">{systemInfo.system?.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Architecture:</span>
                      <span className="font-mono">{systemInfo.system?.arch}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Loading system info...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hardware Info</CardTitle>
              </CardHeader>
              <CardContent>
                {systemInfo ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Memory:</span>
                      <span className="font-mono">
                        {(systemInfo.memory?.total / 1024 / 1024 / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Memory:</span>
                      <span className="font-mono">
                        {(systemInfo.memory?.free / 1024 / 1024 / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU Cores:</span>
                      <span className="font-mono">{systemInfo.cpu?.cores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CPU Model:</span>
                      <span className="font-mono text-xs truncate">
                        {systemInfo.cpu?.model?.substring(0, 30)}...
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">Loading hardware info...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboard;
