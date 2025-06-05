
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface FilterOption {
  field: string;
  condition: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: string;
}

interface FilterProps {
  columns: { field: string; headerName: string; }[];
  onApplyFilters: (filters: FilterOption[]) => void;
  className?: string;
}

const DataFilter: React.FC<FilterProps> = ({ columns, onApplyFilters, className }) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [newFilter, setNewFilter] = useState<FilterOption>({
    field: columns[0]?.field || '',
    condition: 'contains',
    value: ''
  });

  const conditions = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' }
  ];

  const addFilter = () => {
    if (newFilter.value.trim() === '') return;
    
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
    
    // Reset new filter
    setNewFilter({
      field: columns[0]?.field || '',
      condition: 'contains',
      value: ''
    });
    
    setShowFilterForm(false);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    onApplyFilters(updatedFilters);
  };

  const clearAllFilters = () => {
    setFilters([]);
    onApplyFilters([]);
  };

  const getFieldLabel = (field: string) => {
    const column = columns.find(col => col.field === field);
    return column?.headerName || field;
  };

  const getConditionLabel = (condition: string) => {
    const cond = conditions.find(c => c.value === condition);
    return cond?.label || condition;
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilterForm(!showFilterForm)}
          className={`flex items-center gap-1 ${showFilterForm ? 'bg-purple/10 text-purple border-purple/30' : ''}`}
        >
          <Filter size={14} />
          <span>Filter</span>
          {filters.length > 0 && (
            <Badge className="ml-1 bg-purple text-white">{filters.length}</Badge>
          )}
        </Button>
        
        {filters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="px-2 py-1 flex items-center gap-1 bg-slate-100 dark:bg-slate-800"
              >
                <span className="font-medium">{getFieldLabel(filter.field)}</span>
                <span className="text-xs opacity-70">{getConditionLabel(filter.condition)}</span>
                <span className="italic text-purple">{filter.value}</span>
                <X 
                  size={12} 
                  className="ml-1 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter(index)}
                />
              </Badge>
            ))}
            
            {filters.length > 1 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearAllFilters}
                className="h-[26px] text-xs text-red-500 hover:text-red-600"
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>
      
      {showFilterForm && (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {getFieldLabel(newFilter.field)}
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Field</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {columns.map(column => (
                  <DropdownMenuItem 
                    key={column.field}
                    onClick={() => setNewFilter({ ...newFilter, field: column.field })}
                  >
                    <span>{column.headerName}</span>
                    {newFilter.field === column.field && <Check size={16} className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {getConditionLabel(newFilter.condition)}
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Condition</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {conditions.map(condition => (
                  <DropdownMenuItem 
                    key={condition.value}
                    onClick={() => setNewFilter({ 
                      ...newFilter, 
                      condition: condition.value as FilterOption['condition'] 
                    })}
                  >
                    <span>{condition.label}</span>
                    {newFilter.condition === condition.value && <Check size={16} className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex gap-2">
            <Input 
              value={newFilter.value}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              placeholder="Filter value..."
              className="flex-1"
            />
            <Button onClick={addFilter} disabled={newFilter.value.trim() === ''}>
              Add
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DataFilter;
