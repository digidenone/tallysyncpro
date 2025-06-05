import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTallySync } from '@/hooks/useTallySync';
import ConnectionStatusDisplay from '@/components/ui/ConnectionStatusDisplay';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Settings as SettingsIcon, Database, Save, RefreshCw, BookOpen, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import MobileWarning from '@/components/MobileWarning';
import NotificationService from '@/services/NotificationService';
import TallyConfigurationForm from '../components/forms/TallyConfigurationForm';
import automatedTallyService, { AutoSyncConfig } from '../services/AutomatedTallyService';
import { toast } from 'sonner';

const Settings = () => {
  const { 
    isConnecting,
    isConnected, 
    tallyConfig,
    lastChecked,
    updateConfig,
    testConnection
  } = useTallySync();

  // Auto-sync configuration state
  const [autoSyncConfig, setAutoSyncConfig] = useState<AutoSyncConfig>(automatedTallyService.getSyncConfig());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(autoSyncConfig.backgroundSync);

  // Generate financial year options
  const getFinancialYearOptions = (): string[] => {
    const currentYear = new Date().getFullYear();
    const options: string[] = [];
    
    // Generate options for last 3 years, current year, and next year
    for (let i = -3; i <= 1; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      options.push(`${startYear}-${endYear}`);
    }
    
    return options;
  };

  // Update auto-sync configuration
  const updateAutoSyncConfig = (updates: Partial<AutoSyncConfig>) => {
    const newConfig = { ...autoSyncConfig, ...updates };
    setAutoSyncConfig(newConfig);
    automatedTallyService.updateSyncConfig(updates);
    toast.success('Auto-sync settings updated successfully');
  };

  // Toggle auto-sync enabled state
  const toggleAutoSync = () => {
    const newEnabled = !autoSyncEnabled;
    setAutoSyncEnabled(newEnabled);
    updateAutoSyncConfig({ backgroundSync: newEnabled, autoImportOnUpload: newEnabled });
    
    if (newEnabled) {
      automatedTallyService.startMonitoring();
      toast.success('Auto-sync enabled! Files will be automatically processed.');
    } else {
      automatedTallyService.stopMonitoring();
      toast.info('Auto-sync disabled. Manual processing mode active.');
    }
  };

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };  return (
    <AppLayout>
      <MobileWarning />
      <div className="container-desktop-only spacing-desktop-section padding-desktop">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-desktop-xl font-bold gradient-heading">Settings</h1>
        </motion.div>
        
        {/* Connection Status */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="glass-card">            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integrated TallySyncPro Connection Status
              </CardTitle>
              <CardDescription>
                Monitor your direct TallySyncPro integration with Tally. This app connects directly to Tally without requiring a separate backend service.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionStatusDisplay onTestConnection={async () => { await testConnection(); }} />
            </CardContent>          </Card>
        </motion.div>

        {/* Tally Configuration */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <TallyConfigurationForm />
        </motion.div>

        {/* Application Preferences */}
        <motion.div 
          className="glass-card p-6"
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Application Preferences
          </h2>
          
          <motion.div 
            className="space-y-6"
            variants={staggerVariants}
            initial="hidden"
            animate="visible"
          >            <motion.div variants={fadeInVariants} className="grid-cards gap-4 sm:gap-6">
              <div>
                <Label htmlFor="company">Company Name (Optional)</Label>
                <Input
                  id="company"
                  value={tallyConfig.company}
                  onChange={(e) => updateConfig({ company: e.target.value })}
                  placeholder="Your Tally Company Name"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Specify the default company for direct Tally ERP 9 integration</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Tally Version</Label>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Tally ERP 9</span>
                    <Badge variant="secondary">Primary</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">TallySyncPro is specifically designed for Tally ERP 9</p>
                </div>
              </div>
            </motion.div>            <motion.div variants={fadeInVariants} className="grid-cards gap-4 sm:gap-6">
              <div>
                <Label htmlFor="financialYear">Financial Year</Label>
                <Select 
                  value={tallyConfig.financialYear || ''}
                  onValueChange={(value) => updateConfig({ financialYear: value })}
                >
                  <SelectTrigger id="financialYear" className="mt-1">
                    <SelectValue placeholder="Select financial year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Financial Years</SelectLabel>
                      {getFinancialYearOptions().map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Current financial year for entries</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Auto-Sync Configuration */}
        <motion.div
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Automated Sync Configuration
              </CardTitle>
              <CardDescription>
                Configure automated Excel to Tally synchronization. When enabled, uploaded Excel files are automatically processed and imported to Tally ERP 9.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Sync Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Auto-Sync Status</p>
                        <p className="text-lg font-semibold">
                          {autoSyncEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Background Monitor</p>
                        <p className="text-lg font-semibold">
                          {autoSyncConfig.backgroundSync ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${autoSyncConfig.backgroundSync ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Processing Mode</p>
                        <p className="text-lg font-semibold">
                          {autoSyncEnabled ? 'Auto-Sync' : 'Manual XML'}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${autoSyncEnabled ? 'bg-purple-500' : 'bg-orange-500'}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Toggle */}
              <Card className={`border-2 ${autoSyncEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {autoSyncEnabled ? 'Auto-Sync Active' : 'Enable Auto-Sync'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {autoSyncEnabled 
                          ? 'Excel files are automatically processed and synced to Tally ERP 9'
                          : 'Turn on for seamless Excel to Tally integration without manual XML downloads'
                        }
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        const newEnabled = !autoSyncEnabled;
                        setAutoSyncEnabled(newEnabled);
                        updateAutoSyncConfig({ backgroundSync: newEnabled });
                        if (newEnabled) {
                          automatedTallyService.startMonitoring();
                          toast.success('Auto-Sync enabled! Files will now be automatically processed.');
                        } else {
                          automatedTallyService.stopMonitoring();
                          toast.success('Auto-Sync disabled. You can manually download XML files.');
                        }
                      }}
                      variant={autoSyncEnabled ? "destructive" : "default"}
                      className="min-w-[120px]"
                    >
                      {autoSyncEnabled ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>

                  {autoSyncEnabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Auto-detect Tally ERP 9 instances</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Instant Excel file processing</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Automatic XML generation</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Direct Tally import</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              {autoSyncEnabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Advanced Auto-Sync Settings</CardTitle>
                    <CardDescription>
                      Fine-tune automated synchronization behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="syncInterval">Sync Interval (seconds)</Label>
                        <Input
                          id="syncInterval"
                          type="number"
                          min="5"
                          max="300"
                          value={autoSyncConfig.syncInterval}
                          onChange={(e) => updateAutoSyncConfig({ 
                            syncInterval: parseInt(e.target.value) 
                          })}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">How often to sync data with Tally ERP 9</p>
                      </div>

                      <div>
                        <Label htmlFor="retryAttempts">Retry Attempts</Label>
                        <Input
                          id="retryAttempts"
                          type="number"
                          min="1"
                          max="10"
                          value={autoSyncConfig.retryAttempts}
                          onChange={(e) => updateAutoSyncConfig({ 
                            retryAttempts: parseInt(e.target.value) 
                          })}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Number of retry attempts for failed syncs</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>              )}            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Settings;
