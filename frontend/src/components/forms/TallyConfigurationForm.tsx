/**
 * TallyConfigurationForm Component
 * 
 * Comprehensive form for configuring Tally ERP 9 connection settings.
 * Collects all necessary parameters for establishing a connection to Tally.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Settings, 
  TestTube,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  RefreshCw,
  Network,
  Key,
  FolderOpen
} from 'lucide-react';
import { useTallySync } from '@/hooks/useTallySync';
import { toast } from 'sonner';

interface TallyConfigFormProps {
  onConfigSaved?: (config: any) => void;
  onConnectionTested?: (success: boolean) => void;
}

export const TallyConfigurationForm: React.FC<TallyConfigFormProps> = ({
  onConfigSaved,
  onConnectionTested
}) => {
  const { tallyConfig, isConnecting, isConnected, testConnection, saveConfig } = useTallySync();
  
  const [formData, setFormData] = useState({
    // Connection Settings
    server: 'localhost',
    port: '9000',
    odbcPort: '9988',
    
    // Authentication
    username: '',
    password: '',
    
    // Company Details
    company: '',
    dataPath: 'C:\\Program Files\\Tally Solutions\\Tally.ERP 9\\Data',
    
    // Version & Configuration
    tallyVersion: 'ERP9',
    financialYear: '',
    
    // Advanced Settings
    connectionTimeout: '30',
    queryTimeout: '60',
    enableSSL: false,
    
    // Sync Preferences
    autoSync: false,
    syncInterval: '300', // 5 minutes
    batchSize: '100'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Load existing config on component mount
  useEffect(() => {
    if (tallyConfig) {
      setFormData(prev => ({
        ...prev,
        server: tallyConfig.server || 'localhost',
        port: tallyConfig.port?.toString() || '9000',
        company: tallyConfig.company || '',
        username: tallyConfig.username || '',
        password: tallyConfig.password || '',
        dataPath: tallyConfig.dataPath || 'C:\\Program Files\\Tally Solutions\\Tally.ERP 9\\Data',
        tallyVersion: tallyConfig.tallyVersion || 'ERP9',
        financialYear: tallyConfig.financialYear || ''
      }));
    }
  }, [tallyConfig]);

  // Generate financial year options
  const getFinancialYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    for (let i = -3; i <= 1; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      options.push(`${startYear}-${endYear}`);
    }
    
    return options;
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.server.trim()) errors.server = 'Server address is required';
    if (!formData.port.trim()) errors.port = 'Port is required';
    if (!formData.company.trim()) errors.company = 'Company name is required';

    // Port validation
    const port = parseInt(formData.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.port = 'Port must be a valid number between 1 and 65535';
    }

    const odbcPort = parseInt(formData.odbcPort);
    if (isNaN(odbcPort) || odbcPort < 1 || odbcPort > 65535) {
      errors.odbcPort = 'ODBC Port must be a valid number between 1 and 65535';
    }

    // Timeout validation
    const connTimeout = parseInt(formData.connectionTimeout);
    if (isNaN(connTimeout) || connTimeout < 5 || connTimeout > 300) {
      errors.connectionTimeout = 'Connection timeout must be between 5 and 300 seconds';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before testing connection');
      return;
    }

    setIsTestingConnection(true);
    try {
      const config = {
        server: formData.server,
        port: parseInt(formData.port),
        company: formData.company,
        username: formData.username,
        password: formData.password,
        tallyVersion: formData.tallyVersion,
        dataPath: formData.dataPath,
        financialYear: formData.financialYear
      };

      const success = await testConnection();
      onConnectionTested?.(success);
      
      if (success) {
        toast.success('Successfully connected to Tally ERP 9!');
      }
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      const config = {
        server: formData.server,
        port: parseInt(formData.port),
        company: formData.company,
        username: formData.username,
        password: formData.password,
        tallyVersion: formData.tallyVersion,
        dataPath: formData.dataPath,
        financialYear: formData.financialYear
      };

      await saveConfig(config);
      onConfigSaved?.(config);
      toast.success('Configuration saved successfully!');
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  const renderInputField = (
    field: string,
    label: string,
    type: string = 'text',
    placeholder?: string,
    description?: string,
    icon?: React.ReactNode
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <Input
        id={field}
        type={type}
        value={formData[field as keyof typeof formData] as string}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className={validationErrors[field] ? 'border-red-500' : ''}
      />
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      {validationErrors[field] && (
        <p className="text-xs text-red-500">{validationErrors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tally ERP 9 Configuration</h2>
          <p className="text-slate-600">Configure your connection to Tally ERP 9</p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Connected" : "Not Connected"}
        </Badge>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Configuration
              </CardTitle>
              <CardDescription>
                Configure the network settings to connect to your Tally ERP 9 installation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {renderInputField(
                  'server',
                  'Server Address',
                  'text',
                  'localhost or IP address',
                  'IP address or hostname where Tally ERP 9 is running',
                  <Network className="h-4 w-4" />
                )}
                {renderInputField(
                  'port',
                  'Data Server Port',
                  'number',
                  '9000',
                  'Port number for Tally data server (usually 9000)',
                  <Database className="h-4 w-4" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderInputField(
                  'odbcPort',
                  'ODBC Server Port',
                  'number',
                  '9988',
                  'Port number for Tally ODBC server (usually 9988)',
                  <Database className="h-4 w-4" />
                )}
                {renderInputField(
                  'connectionTimeout',
                  'Connection Timeout (seconds)',
                  'number',
                  '30',
                  'Maximum time to wait for connection',
                  <RefreshCw className="h-4 w-4" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Settings
              </CardTitle>
              <CardDescription>
                Enter your Tally login credentials (if security control is enabled)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  If your Tally ERP 9 has security control enabled, provide the username and password.
                  Leave blank if no security is configured.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                {renderInputField(
                  'username',
                  'Username',
                  'text',
                  'Tally username (optional)',
                  'Leave blank if no security control is enabled',
                  <Key className="h-4 w-4" />
                )}
                {renderInputField(
                  'password',
                  'Password',
                  'password',
                  'Tally password (optional)',
                  'Leave blank if no security control is enabled',
                  <Key className="h-4 w-4" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Specify your company details and data location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderInputField(
                'company',
                'Company Name',
                'text',
                'Your company name in Tally',
                'Exact name of the company as it appears in Tally ERP 9',
                <Database className="h-4 w-4" />
              )}
              {renderInputField(
                'dataPath',
                'Tally Data Path',
                'text',
                'C:\\Program Files\\Tally Solutions\\Tally.ERP 9\\Data',
                'Full path to your Tally data directory',
                <FolderOpen className="h-4 w-4" />
              )}
              <div>
                <Label htmlFor="financialYear" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Financial Year
                </Label>
                <Select 
                  value={formData.financialYear} 
                  onValueChange={(value) => handleInputChange('financialYear', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select financial year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFinancialYearOptions().map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Current financial year for data operations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Configure advanced synchronization and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {renderInputField(
                  'queryTimeout',
                  'Query Timeout (seconds)',
                  'number',
                  '60',
                  'Maximum time to wait for query execution',
                  <RefreshCw className="h-4 w-4" />
                )}
                {renderInputField(
                  'batchSize',
                  'Batch Size',
                  'number',
                  '100',
                  'Number of records to process in each batch',
                  <Database className="h-4 w-4" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {renderInputField(
                  'syncInterval',
                  'Auto-Sync Interval (seconds)',
                  'number',
                  '300',
                  'Interval between automatic sync operations',
                  <RefreshCw className="h-4 w-4" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 pt-4">
        <Button 
          onClick={handleTestConnection} 
          disabled={isTestingConnection || isConnecting}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isTestingConnection || isConnecting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4" />
          )}
          Test Connection
        </Button>
        
        <Button 
          onClick={handleSaveConfig}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>

      {isConnected && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully connected to Tally ERP 9! You can now start syncing data.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TallyConfigurationForm;
