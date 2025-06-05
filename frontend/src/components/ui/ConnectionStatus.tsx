
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  onRetry: () => void;
  lastChecked?: string;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  onRetry,
  lastChecked,
  className
}) => {
  // Format lastChecked date if it exists
  const formattedLastChecked = lastChecked ? 
    format(new Date(lastChecked), 'yyyy-MM-dd HH:mm:ss') : 
    undefined;
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-md border text-sm",
      isConnected ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30" : 
                   "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30",
      className
    )}>
      <div className="flex items-center gap-2">
        {isConnecting ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-4 w-4 text-blue-500" />
          </motion.div>
        ) : isConnected ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
        
        <div className="flex flex-col">
          <span className={cn(
            "font-medium",
            isConnected ? "text-green-600 dark:text-green-400" : 
                         "text-amber-600 dark:text-amber-400",
          )}>
            {isConnecting ? "Connecting..." : isConnected ? "Connected to Tally" : "Not connected"}
          </span>
          {formattedLastChecked && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Last checked: {formattedLastChecked}
            </span>
          )}
        </div>
      </div>
      
      {!isConnecting && !isConnected && (
        <button 
          onClick={onRetry}
          className="text-xs px-2 py-1 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;
