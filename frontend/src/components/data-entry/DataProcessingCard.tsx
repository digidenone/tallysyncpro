
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Database, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface DataProcessingCardProps {
  gridData: Record<string, unknown>[];
  voucherType: string;
  tallyLedger: string;
  onGenerateXml: () => Promise<void>;
  onSyncWithTally: () => Promise<void>;
  isGeneratingXml: boolean;
  isSyncing: boolean;
  isConnected: boolean;
}

const DataProcessingCard: React.FC<DataProcessingCardProps> = ({
  gridData,
  voucherType,
  tallyLedger,
  onGenerateXml,
  onSyncWithTally,
  isGeneratingXml,
  isSyncing,
  isConnected
}) => {
  const hasData = gridData.length > 0;
  
  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 24,
        duration: 0.4
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="overflow-hidden glass-card border-purple-light/20">
          <CardHeader className="bg-gradient-to-r from-purple-light/10 to-teal-light/10">
            <CardTitle className="text-xl flex items-center gap-2">
              <Download className="h-5 w-5 text-purple" />
              Generate Tally XML
            </CardTitle>
            <CardDescription>
              Export your data to Tally-compatible XML format
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Records</div>
                <div className="text-2xl font-semibold text-slate-800 dark:text-slate-200">{gridData.length}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                <div className="text-sm text-slate-500 dark:text-slate-400">Type</div>
                <div className="text-2xl font-semibold text-slate-800 dark:text-slate-200">{voucherType}</div>
              </div>
            </div>
            
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <span className={`h-2 w-2 rounded-full mr-2 ${hasData ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                <span className={hasData ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}>
                  {hasData ? `${gridData.length} records ready for export` : 'No data available'}
                </span>
              </li>
              <li className="flex items-center text-sm">
                <span className="h-2 w-2 rounded-full mr-2 bg-green-500"></span>
                <span className="text-slate-700 dark:text-slate-300">Default ledger: {tallyLedger || 'None'}</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700/30">
            <Button 
              onClick={onGenerateXml}
              disabled={isGeneratingXml || !hasData}
              className="w-full bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white shadow-lg hover:shadow-xl transition-all h-11 group"
            >
              <Download className="mr-2 h-4 w-4 group-hover:animate-bounce" />
              {isGeneratingXml ? 'Generating...' : 'Generate Tally XML'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
      
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden glass-card border-purple-light/20">
          <CardHeader className="bg-gradient-to-r from-purple-light/10 to-teal-light/10">
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="h-5 w-5 text-purple" />
              Direct Tally Sync
            </CardTitle>
            <CardDescription>
              Sync data directly to Tally via ODBC connection
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              {isConnected ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <div>
                    <div className="font-medium">Connected to Tally</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Ready to sync data</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <div>
                    <div className="font-medium">Not connected to Tally</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Check connection settings</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-800 px-2 text-xs text-slate-500 dark:text-slate-400">Direct ODBC data transfer</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-20 h-20 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">App</div>
                <div className="font-semibold">Data</div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple animate-pulse" />
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-20 h-20 flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">Tally</div>
                <div className="font-semibold">ERP</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700/30">
            <Button 
              onClick={onSyncWithTally}
              disabled={isSyncing || !hasData || !isConnected}
              className="w-full bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white shadow-lg hover:shadow-xl transition-all h-11 group"
            >
              <Database className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              {isSyncing ? 'Syncing...' : 'Sync with Tally via ODBC'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default DataProcessingCard;
