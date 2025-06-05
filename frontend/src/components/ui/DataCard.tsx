
import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'glass' | 'neo';
  className?: string;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'glass',
  className,
}) => {
  return (
    <div 
      className={cn(
        "p-4 sm:p-6 w-full h-full",
        variant === 'glass' ? 'glass-card' : 'neo-card',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</h3>
        {icon && <div className="text-slate-400 dark:text-slate-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            trend.isPositive ? "text-success" : "text-error"
          )}>
            {trend.isPositive ? (
              <ArrowUp className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      {subtitle && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default DataCard;
