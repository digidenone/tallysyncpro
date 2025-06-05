import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, FileCheck, AlertCircle, FileSpreadsheet, CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layout/AppLayout';
import MobileWarning from '@/components/MobileWarning';

// Types
interface VerificationResult {
  id: number;
  type: 'error' | 'warning' | 'success';
  message: string;
  data: {
    row: number | string;
    field: string;
    value: string | number;
  };
}

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

const Verification = () => {
  const [verifyProgress, setVerifyProgress] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('errors');
  
  // Sample data verification results
  const generateVerificationData = (): VerificationResult[] => {
    return [
      {
        id: 1,
        type: 'error',
        message: 'Invalid GSTIN format for Customer XYZ',
        data: { row: 3, field: 'gstin', value: 'GSTIN12345XX' }
      },
      {
        id: 2,
        type: 'warning',
        message: 'Date format inconsistency detected',
        data: { row: 5, field: 'date', value: '30-02-2023' }
      },
      {
        id: 3,
        type: 'error',
        message: 'Missing mandatory party name',
        data: { row: 8, field: 'customer', value: '' }
      },
      {
        id: 4,
        type: 'warning',
        message: 'Amount seems unusually high',
        data: { row: 12, field: 'amount', value: '1500000' }
      },
      {
        id: 5,
        type: 'success',
        message: 'All voucher data validates successfully',
        data: { row: 15, field: 'all', value: 'complete' }
      },
      {
        id: 6,
        type: 'error',
        message: 'Duplicate invoice number detected',
        data: { row: 18, field: 'invoice', value: 'INV-2023042' }
      },
      {
        id: 7,
        type: 'warning',
        message: 'Cost center not recognized in Tally',
        data: { row: 20, field: 'costCenter', value: 'Remote Office' }
      },
      {
        id: 8,
        type: 'success',
        message: 'All ledger entries match with Tally',
        data: { row: 'all', field: 'ledgerMatch', value: 'verified' }
      }
    ];
  };
  
  const handleStartVerification = () => {
    setVerifyProgress(0);
    setIsVerifying(true);
    
    // Simulate verification process
    const interval = setInterval(() => {
      setVerifyProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsVerifying(false);
          // Set results after completion
          setVerificationResults(generateVerificationData());
          toast.success('Data verification complete');
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Filter results based on search term and active tab
  const filteredResults = verificationResults.filter(item => {
    const matchesSearch = 
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.data.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.data.value).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return item.type === activeTab && matchesSearch;
  });
  
  // Count results by type
  const errorCount = verificationResults.filter(item => item.type === 'error').length;
  const warningCount = verificationResults.filter(item => item.type === 'warning').length;
  const successCount = verificationResults.filter(item => item.type === 'success').length;    return (
    <AppLayout>
      <MobileWarning />
      <div className="container-desktop-only spacing-desktop-section padding-desktop">
      <motion.div 
        className="flex justify-between items-center gap-4 bg-gradient-to-r from-purple-light/10 via-teal-light/5 to-purple-light/10 p-5 rounded-xl border border-slate-200 dark:border-slate-700/30 shadow-md"
        initial="hidden"
        animate="visible"
        variants={fadeInUpVariants}
      >
        <div className="space-y-1">
          <h1 className="gradient-heading text-desktop-xl flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-purple-light" />
            Data Verification
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Verify and validate your data before importing into Tally
          </p>
        </div>        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleStartVerification}
            disabled={isVerifying}
            className="btn-mobile bg-purple text-white hover:bg-purple-dark flex items-center gap-1.5"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Start Verification</span>
              </>
            )}
          </Button>
        </div>
      </motion.div>
      
      {isVerifying && (
        <motion.div 
          className="card-mobile p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-responsive-lg font-medium mb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple animate-spin" />
            Verification in Progress
          </h2>
          <Progress value={verifyProgress} className="h-2 mb-2" />
          <div className="flex justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span>Analyzing data structure...</span>
            <span>{verifyProgress}%</span>
          </div>
        </motion.div>
      )}
      
      {verificationResults.length > 0 && !isVerifying && (
        <div className="space-y-4 sm:space-y-6">
          <motion.div 
            className="grid-stats gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >            <Card className="card-mobile border-red-500/30 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  <span>Errors</span>
                  <Badge variant="destructive">{errorCount}</Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Critical issues that need to be fixed</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="card-mobile border-yellow-500/30 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  <span>Warnings</span>
                  <Badge className="bg-yellow-500">{warningCount}</Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Issues that may cause problems</CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="card-mobile border-green-500/30 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <span>Success</span>
                  <Badge className="bg-green-500">{successCount}</Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Validation checks passed</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
          
          <motion.div 
            className="card-mobile bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-responsive-lg font-medium flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-purple" />
                Verification Results
              </h2>
              
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search issues..."                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
            </div>
            
            <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-2 sm:px-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                <TabsList className="h-10 bg-transparent border-b-0 w-full justify-start">
                  <TabsTrigger value="all" className="data-[state=active]:text-purple data-[state=active]:border-b-2 data-[state=active]:border-purple rounded-none text-xs sm:text-sm whitespace-nowrap">
                    All Issues
                  </TabsTrigger>
                  <TabsTrigger value="error" className="data-[state=active]:text-red-500 data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none text-xs sm:text-sm whitespace-nowrap">
                    Errors
                  </TabsTrigger>
                  <TabsTrigger value="warning" className="data-[state=active]:text-yellow-500 data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 rounded-none text-xs sm:text-sm whitespace-nowrap">
                    Warnings
                  </TabsTrigger>
                  <TabsTrigger value="success" className="data-[state=active]:text-green-500 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none text-xs sm:text-sm whitespace-nowrap">
                    Success
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all" className="mt-0">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredResults.length > 0 ? (
                    filteredResults.map(item => (
                      <div key={item.id} className="p-3 sm:p-4 flex flex-col sm:flex-row items-start gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {item.type === 'error' && <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />}
                          {item.type === 'warning' && <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />}
                          {item.type === 'success' && <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />}
                          
                          <div className="flex-1">
                            <p className="font-medium text-slate-700 dark:text-slate-200 text-sm sm:text-base">{item.message}</p>
                            <div className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                              {item.data.row !== 'all' && <span>Row: {item.data.row}</span>}
                              <span>Field: {item.data.field}</span>
                              <span>Value: {item.data.value}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full sm:w-auto sm:flex-shrink-0">
                          {item.type === 'error' && (
                            <Button size="sm" variant="destructive" className="btn-mobile-full sm:w-auto">Fix</Button>
                          )}
                          {item.type === 'warning' && (
                            <Button size="sm" variant="outline" className="btn-mobile-full sm:w-auto">Review</Button>
                          )}                          {item.type === 'success' && (
                            <Button size="sm" variant="outline" className="btn-mobile-full sm:w-auto opacity-0">Done</Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No issues found matching your criteria</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="error" className="mt-0">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredResults.length > 0 ? (
                    filteredResults.map(item => (
                      <div key={item.id} className="p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        
                        <div className="flex-1">
                          <p className="font-medium text-slate-700 dark:text-slate-200">{item.message}</p>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="mr-3">Row: {item.data.row}</span>
                            <span className="mr-3">Field: {item.data.field}</span>
                            <span>Value: {item.data.value}</span>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="destructive">Fix</Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-30 text-green-500" />
                      <p>No errors found - that's great!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="warning" className="mt-0">
                {/* Similar structure as the error tab, with warning styling */}
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredResults.length > 0 ? (
                    filteredResults.map(item => (
                      <div key={item.id} className="p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        
                        <div className="flex-1">
                          <p className="font-medium text-slate-700 dark:text-slate-200">{item.message}</p>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="mr-3">Row: {item.data.row}</span>
                            <span className="mr-3">Field: {item.data.field}</span>
                            <span>Value: {item.data.value}</span>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline">Review</Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-30 text-green-500" />
                      <p>No warnings found - looking good!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="success" className="mt-0">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredResults.length > 0 ? (
                    filteredResults.map(item => (
                      <div key={item.id} className="p-4 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        
                        <div className="flex-1">
                          <p className="font-medium text-slate-700 dark:text-slate-200">{item.message}</p>
                          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span className="mr-3">{item.data.field}</span>
                            <span>{item.data.value}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No success validation records found</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <CardFooter className="border-t border-slate-200 dark:border-slate-700 p-4">
              <div className="w-full flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {filteredResults.length} issues found
                </span>
                
                <div className="flex gap-2">
                  <Button onClick={handleStartVerification} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" /> Recheck
                  </Button>
                  <Button className="bg-purple text-white hover:bg-purple-dark" size="sm">
                    <Check className="h-4 w-4 mr-1" /> Fix All Issues
                  </Button>
                </div>
              </div>
            </CardFooter>
          </motion.div>
        </div>
      )}
    </div>
    </AppLayout>
  );
};

export default Verification;
