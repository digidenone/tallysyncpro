
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Search, ArrowDownUp, Calendar } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterCriteria {
  dateRange: {
    startDate: Date | undefined;
    endDate: Date | undefined;
  };
  search: string;
  statusFilter: string;
  amountRange: {
    min: string;
    max: string;
  };
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

interface DataAdvancedFilterProps {
  onFilterChange: (criteria: FilterCriteria) => void;
  totalItems: number;
  filteredItems: number;
}

const DataAdvancedFilter: React.FC<DataAdvancedFilterProps> = ({ 
  onFilterChange, 
  totalItems,
  filteredItems
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [criteria, setCriteria] = useState<FilterCriteria>({
    dateRange: {
      startDate: undefined,
      endDate: undefined
    },
    search: '',
    statusFilter: 'all',
    amountRange: {
      min: '',
      max: ''
    },
    sortField: 'date',
    sortDirection: 'desc'
  });
  
  const [activeFilters, setActiveFilters] = useState(0);

  // Update filter count badge
  useEffect(() => {
    let count = 0;
    if (criteria.search) count++;
    if (criteria.statusFilter !== 'all') count++;
    if (criteria.dateRange.startDate || criteria.dateRange.endDate) count++;
    if (criteria.amountRange.min || criteria.amountRange.max) count++;
    setActiveFilters(count);
  }, [criteria]);

  // Apply filters on change
  useEffect(() => {
    onFilterChange(criteria);
  }, [criteria, onFilterChange]);

  const handleChange = (
    field: keyof FilterCriteria, 
    value: any, 
    subField?: string
  ) => {
    if (subField) {
      setCriteria(prev => {
        if (field === 'dateRange' || field === 'amountRange') {
          // Properly handle these specific object types
          return {
            ...prev,
            [field]: {
              ...prev[field],
              [subField]: value
            }
          };
        }
        return prev;
      });
    } else {
      setCriteria(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const resetFilters = () => {
    setCriteria({
      dateRange: {
        startDate: undefined,
        endDate: undefined
      },
      search: '',
      statusFilter: 'all',
      amountRange: {
        min: '',
        max: ''
      },
      sortField: 'date',
      sortDirection: 'desc'
    });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant={activeFilters > 0 ? "default" : "outline"} 
                size="sm"
                className={`flex items-center gap-2 ${activeFilters > 0 ? 'bg-purple text-white' : ''}`}
              >
                <Filter size={16} />
                <span>Advanced Filters</span>
                {activeFilters > 0 && (
                  <Badge className="bg-white text-purple ml-1">{activeFilters}</Badge>
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          
          {/* Quick search always visible */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search data..."
              value={criteria.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="pl-9 w-full md:w-60 h-9"
            />
          </div>
        </div>
        
        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
          {filteredItems !== totalItems ? (
            <span>Showing <strong className="text-purple-light">{filteredItems}</strong> of {totalItems} entries</span>
          ) : (
            <span>Total entries: {totalItems}</span>
          )}
        </div>
      </div>
      
      <Collapsible open={isOpen}>
        <CollapsibleContent>
          <motion.div 
            className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" /> Date Range
                </label>
                <div className="flex gap-2 items-center">
                  <DatePicker
                    selected={criteria.dateRange.startDate}
                    onSelect={(date) => handleChange('dateRange', date, 'startDate')}
                    placeholder="Start date"
                  />
                  <span className="text-slate-500">to</span>
                  <DatePicker
                    selected={criteria.dateRange.endDate}
                    onSelect={(date) => handleChange('dateRange', date, 'endDate')}
                    placeholder="End date"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <Select 
                  value={criteria.statusFilter} 
                  onValueChange={(value) => handleChange('statusFilter', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Amount Range (₹)
                </label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    placeholder="Min"
                    value={criteria.amountRange.min}
                    onChange={(e) => handleChange('amountRange', e.target.value, 'min')}
                  />
                  <span className="text-slate-500 flex items-center">to</span>
                  <Input 
                    type="number"
                    placeholder="Max"
                    value={criteria.amountRange.max}
                    onChange={(e) => handleChange('amountRange', e.target.value, 'max')}
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <ArrowDownUp className="h-4 w-4 mr-1" /> Sort By
                </label>
                <div className="flex gap-2">
                  <Select 
                    value={criteria.sortField} 
                    onValueChange={(value) => handleChange('sortField', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sort field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={criteria.sortDirection} 
                    onValueChange={(value) => handleChange('sortDirection', value as 'asc' | 'desc')}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="flex items-center gap-1"
              >
                <X size={14} />
                <span>Reset Filters</span>
              </Button>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DataAdvancedFilter;
