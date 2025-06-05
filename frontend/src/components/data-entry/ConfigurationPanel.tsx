
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Database, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ConnectionStatus from '@/components/ui/ConnectionStatus';

interface ConfigurationPanelProps {
  voucherType: string;
  setVoucherType: (value: string) => void;
  tallyLedger: string;
  setTallyLedger: (value: string) => void;
  financialYear: string;
  setFinancialYear: (value: string) => void;
  effectiveDate: string;
  setEffectiveDate: (value: string) => void;
  configExpanded: boolean;
  setConfigExpanded: (value: boolean) => void;
  autodetectedConfig: {
    voucherType: string;
    ledgers: string[];
  };
  getFinancialYearOptions: () => string[];
  isConnected: boolean;
  isConnecting: boolean;
  lastChecked: number | null;
  onTestConnection: () => void;
  onGenerateXml: () => Promise<void>;
  onSyncWithTally: () => Promise<void>;
  isGeneratingXml: boolean;
  isSyncing: boolean;
  hasData: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  voucherType,
  setVoucherType,
  tallyLedger,
  setTallyLedger,
  financialYear,
  setFinancialYear,
  effectiveDate,
  setEffectiveDate,
  configExpanded,
  setConfigExpanded,
  autodetectedConfig,
  getFinancialYearOptions,
  isConnected,
  isConnecting,
  lastChecked,
  onTestConnection,
  onGenerateXml,
  onSyncWithTally,
  isGeneratingXml,
  isSyncing,
  hasData
}) => {
  // Animation variants
  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const fadeInVariants = {
    hidden: { opacity: 0, y: 10 },
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

  return (
    <motion.div 
      className="glass-card p-5 sm:p-6 shadow-lg border-purple/10"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      transition={{ delay: 0.3 }}
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Database size={18} className="text-purple" />
          Tally Configuration
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfigExpanded(!configExpanded)}
          className="text-xs hover:bg-purple/5 hover:text-purple"
        >
          {configExpanded ? 'Show Less' : 'Show More'}
        </Button>
      </div>
      
      {autodetectedConfig.ledgers.length > 0 && (
        <div className="mb-5 p-3 bg-gradient-to-r from-purple/5 to-teal-light/5 border border-purple/20 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium text-purple inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-purple animate-pulse"></span>
              Auto-detected:
            </span> 
            {autodetectedConfig.voucherType && (
              <span className="block mt-1.5">Voucher Type: <span className="font-medium">{autodetectedConfig.voucherType}</span></span>
            )}
            {autodetectedConfig.ledgers.length > 0 && (
              <span className="block mt-1">Ledgers: <span className="font-medium">{autodetectedConfig.ledgers.slice(0, 3).join(', ')}{autodetectedConfig.ledgers.length > 3 ? ` +${autodetectedConfig.ledgers.length - 3} more` : ''}</span></span>
            )}
          </p>
        </div>
      )}
      
      <motion.div 
        className="space-y-5"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="voucherType" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              Voucher Type
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle size={14} className="text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                    <p className="w-[200px] text-xs">Specifies the type of voucher to create in Tally</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={voucherType} onValueChange={setVoucherType}>
              <SelectTrigger id="voucherType" className="w-full bg-white dark:bg-slate-800 shadow-sm">
                <SelectValue placeholder="Select voucher type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800">
                <SelectGroup>
                  <SelectLabel>Common Types</SelectLabel>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Receipt">Receipt</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Journal">Journal</SelectItem>
                  <SelectItem value="Contra">Contra</SelectItem>
                  <SelectItem value="Debit Note">Debit Note</SelectItem>
                  <SelectItem value="Credit Note">Credit Note</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="tallyLedger" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              Default Ledger Name
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle size={14} className="text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                    <p className="w-[250px] text-xs">Used as fallback when no ledger is specified in the data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            {autodetectedConfig.ledgers.length > 0 ? (
              <Select value={tallyLedger} onValueChange={setTallyLedger}>
                <SelectTrigger id="tallyLedger" className="w-full bg-white dark:bg-slate-800 shadow-sm">
                  <SelectValue placeholder="Select ledger" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800">
                  <SelectGroup>
                    <SelectLabel>Detected Ledgers</SelectLabel>
                    {autodetectedConfig.ledgers.map(ledger => (
                      <SelectItem key={ledger} value={ledger}>{ledger}</SelectItem>
                    ))}
                    <SelectItem value="custom">Use Custom...</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="tallyLedger"
                value={tallyLedger}
                onChange={(e) => setTallyLedger(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 shadow-sm"
                placeholder="e.g., Sales Ledger"
              />
            )}
          </div>
        </motion.div>
        
        <AnimatePresence>
          {configExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financialYear" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    Financial Year
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle size={14} className="text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                          <p className="w-[200px] text-xs">The financial year for these entries (Apr-Mar in India)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Select value={financialYear} onValueChange={setFinancialYear}>
                    <SelectTrigger id="financialYear" className="w-full bg-white dark:bg-slate-800 shadow-sm">
                      <SelectValue placeholder="Select financial year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800">
                      <SelectGroup>
                        <SelectLabel>Financial Years</SelectLabel>
                        {getFinancialYearOptions().map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="effectiveDate" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    Effective Date
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle size={14} className="text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                          <p className="w-[200px] text-xs">The date when these entries take effect (if different from transaction date)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isBillWise"
                    className="h-4 w-4 text-purple border-slate-300 dark:border-slate-700 rounded focus:ring-purple"
                  />
                  <Label htmlFor="isBillWise" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                    Bill-wise Entry
                  </Label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isInvoice"
                    className="h-4 w-4 text-purple border-slate-300 dark:border-slate-700 rounded focus:ring-purple"
                  />
                  <Label htmlFor="isInvoice" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                    Invoice Entry
                  </Label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <ConnectionStatus 
          isConnected={isConnected} 
          isConnecting={isConnecting} 
          onRetry={onTestConnection} 
          lastChecked={lastChecked ? new Date(lastChecked).toISOString() : undefined}
        />
        
        <div className="pt-3 space-y-3.5">
          <Button 
            onClick={onGenerateXml}
            disabled={isGeneratingXml || !hasData}
            className="w-full bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white shadow-lg hover:shadow-xl transition-all h-11 group"
          >
            <Download className="mr-2 h-4 w-4 group-hover:animate-bounce" />
            {isGeneratingXml ? 'Generating...' : 'Convert to Tally XML'}
          </Button>
          
          <Button 
            onClick={onSyncWithTally}
            disabled={isSyncing || !hasData || !isConnected}
            className="w-full bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white shadow-lg hover:shadow-xl transition-all h-11 group"
          >
            <Database className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            {isSyncing ? 'Syncing...' : 'Sync with Tally via ODBC'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfigurationPanel;
