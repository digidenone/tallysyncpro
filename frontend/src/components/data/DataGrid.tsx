
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, FileSearch, ArrowRight, Filter, MoreHorizontal, Download, Trash2, SortAsc, SortDesc, Table } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from "@/components/ui/checkbox";

interface DataGridColumn {
  field: string;
  headerName: string;
  width?: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
}

interface DataGridProps {
  columns: DataGridColumn[];
  data: Record<string, unknown>[];
  onDataChange?: (newData: Record<string, unknown>[]) => void;
  title?: string;
  height?: string | number;
  className?: string;
}

const DataGrid: React.FC<DataGridProps> = ({
  columns,
  data: initialData,
  onDataChange,
  title = 'Data Grid',
  height = '600px',
  className,
}) => {
  const [data, setData] = useState<Record<string, unknown>[]>(initialData || []);
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setData(initialData || []);
  }, [initialData]);

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Sort data if sortField is set
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const valueA = a[sortField];
    const valueB = b[sortField];
    
    if (valueA === valueB) return 0;
    
    // Handle different types appropriately
    const column = columns.find(col => col.field === sortField);
    
    if (column?.type === 'number') {
      return sortDirection === 'asc' 
        ? Number(valueA || 0) - Number(valueB || 0) 
        : Number(valueB || 0) - Number(valueA || 0);
    } else if (column?.type === 'date') {
      const dateA = valueA ? new Date(valueA as string | number | Date).getTime() : 0;
      const dateB = valueB ? new Date(valueB as string | number | Date).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      // Default string comparison
      const strA = String(valueA || '').toLowerCase();
      const strB = String(valueB || '').toLowerCase();
      return sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    }
  });

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const column = columns[colIndex];
    if (!column.editable) return;

    setSelectedCell({ rowIndex, colIndex });
    setEditValue(String(sortedData[rowIndex][column.field] || ''));
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (isEditing && selectedCell) {
      saveChanges();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveChanges();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setSelectedCell(null);
      e.preventDefault();
    }
  };

  const saveChanges = () => {
    if (!selectedCell) return;
    
    const { rowIndex, colIndex } = selectedCell;
    const column = columns[colIndex];
    const updatedData = [...data];
    
    // Get the actual index in the original data array
    const originalIndex = data.indexOf(sortedData[rowIndex]);
    if (originalIndex === -1) return;
    
    // Update the value
    let newValue = editValue;
    
    // Type conversion based on column type
    if (column.type === 'number') {
      newValue = editValue === '' ? '' : String(Number(editValue));
    }
    
    updatedData[originalIndex] = {
      ...updatedData[originalIndex],
      [column.field]: newValue
    };
    
    setData(updatedData);
    if (onDataChange) {
      onDataChange(updatedData);
    }
    
    setIsEditing(false);
    setSelectedCell(null);
    
    // Show a subtle toast notification for feedback
    toast.success('Cell updated', {
      duration: 1500,
      position: 'bottom-right',
    });
  };

  const addNewRow = () => {
    const newRow = columns.reduce((acc, column) => {
      acc[column.field] = '';
      return acc;
    }, {} as Record<string, unknown>);
    
    const updatedData = [...data, newRow];
    setData(updatedData);
    
    if (onDataChange) {
      onDataChange(updatedData);
    }
    
    // Scroll to bottom and select first cell of new row
    setTimeout(() => {
      if (gridRef.current) {
        gridRef.current.scrollTop = gridRef.current.scrollHeight;
      }
      setSelectedCell({ rowIndex: updatedData.length - 1, colIndex: 0 });
      setEditValue('');
      setIsEditing(true);
    }, 0);
    
    toast.success('New row added', {
      duration: 1500,
      position: 'bottom-right',
    });
  };

  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
    if (!showSearchBar) {
      setTimeout(() => {
        const searchInput = document.getElementById('grid-search');
        if (searchInput) searchInput.focus();
      }, 0);
    } else {
      setSearchTerm('');
    }
  };

  const toggleRowSelection = (rowIndex: number) => {
    setSelectedRows(prev => {
      if (prev.includes(rowIndex)) {
        return prev.filter(i => i !== rowIndex);
      } else {
        return [...prev, rowIndex];
      }
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const deleteSelectedRows = () => {
    if (selectedRows.length === 0) return;
    
    // Get the actual indices of the selected rows in the original data
    const indicesToDelete = selectedRows.map(rowIndex => {
      return data.indexOf(sortedData[rowIndex]);
    }).filter(index => index !== -1).sort((a, b) => b - a); // Sort descending to avoid index issues when deleting
    
    const updatedData = [...data];
    indicesToDelete.forEach(index => {
      updatedData.splice(index, 1);
    });
    
    setData(updatedData);
    setSelectedRows([]);
    
    if (onDataChange) {
      onDataChange(updatedData);
    }
    
    toast.success(`${indicesToDelete.length} row(s) deleted`, {
      duration: 1500,
      position: 'bottom-right',
    });
  };

  const getTotalWidth = () => {
    return columns.reduce((acc, col) => acc + (col.width || 150), 0);
  };

  // Animation variants
  const fadeInVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0, 
      transition: { 
        delay: i * 0.05,
        duration: 0.3
      } 
    })
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      className={cn("glass-card overflow-hidden flex flex-col", className)}
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/50 dark:to-slate-800/80">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Table size={18} className="text-purple" />
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {showSearchBar && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <input
                  id="grid-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple"
                  placeholder="Search..."
                />
                {searchTerm && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">
                    {sortedData.length} results
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSearchBar}
                  className="h-9 px-3 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <FileSearch className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only md:inline-block">Search</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                <p>Search data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-3 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  <span className="sr-only md:not-sr-only md:inline-block">Filter</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                <p>Filter data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                className="h-9 px-3 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700">
              <DropdownMenuItem onClick={deleteSelectedRows} disabled={selectedRows.length === 0} className="cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Selected</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                <span>Export Data</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={addNewRow}
                  className="h-9 px-3 bg-gradient-to-r from-purple to-teal-light hover:from-purple-dark hover:to-teal-dark text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Row</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-white dark:bg-slate-800 shadow-xl">
                <p>Add a new row</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div 
        ref={gridRef} 
        className="overflow-auto flex-1 scrollbar-thin"
        style={{ height, maxHeight: typeof height === 'string' ? height : `${height}px` }}
      >
        <div 
          className="min-w-full table"
          style={{ width: `${getTotalWidth()}px` }}
        >
          {/* Header */}
          <div className="table-header-group sticky top-0 z-10">
            <div className="table-row">
              <div className="table-cell data-grid-header border-b border-r border-slate-200 dark:border-slate-700 w-[40px] p-0 text-center">
                <Checkbox
                  checked={selectedRows.length > 0 && selectedRows.length === sortedData.length}
                  onCheckedChange={() => {
                    if (selectedRows.length === sortedData.length) {
                      setSelectedRows([]);
                    } else {
                      setSelectedRows(sortedData.map((_, index) => index));
                    }
                  }}
                  className="data-[state=checked]:bg-purple data-[state=checked]:text-white"
                />
              </div>
              {columns.map((column, colIndex) => (
                <div 
                  key={colIndex} 
                  className="table-cell data-grid-header border-b border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none"
                  style={{ width: column.width || 150 }}
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.headerName}</span>
                    {sortField === column.field && (
                      <motion.div
                        animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortDirection === 'asc' ? (
                          <SortAsc className="h-3 w-3 text-purple" />
                        ) : (
                          <SortDesc className="h-3 w-3 text-purple" />
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Body */}
          <div className="table-row-group">
            {sortedData.length === 0 ? (
              <div className="table-row">
                <div 
                  className="table-cell p-6 text-center text-slate-500 italic"
                  style={{ gridColumn: `span ${columns.length + 1}` }}
                >
                  No data available
                </div>
              </div>
            ) : (
              sortedData.map((row, rowIndex) => (
                <motion.div 
                  key={rowIndex} 
                  className={cn(
                    "table-row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                    selectedRows.includes(rowIndex) ? "bg-purple-light/10" : ""
                  )}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  custom={rowIndex}
                >
                  <div 
                    className="table-cell data-grid-cell text-center p-0"
                    onClick={() => toggleRowSelection(rowIndex)}
                  >
                    <Checkbox
                      checked={selectedRows.includes(rowIndex)}
                      onCheckedChange={() => toggleRowSelection(rowIndex)}
                      className="data-[state=checked]:bg-purple data-[state=checked]:text-white"
                    />
                  </div>
                  {columns.map((column, colIndex) => (
                    <div 
                      key={colIndex} 
                      className={cn(
                        "table-cell data-grid-cell relative",
                        selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex ? 'grid-cell-selected' : '',
                        column.type === 'number' ? 'text-right' : ''
                      )}
                      style={{ width: column.width || 150 }}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {isEditing && selectedCell?.rowIndex === rowIndex && selectedCell?.colIndex === colIndex ? (
                        <input
                          ref={inputRef}
                          type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                          value={editValue}
                          onChange={handleInputChange}
                          onBlur={handleInputBlur}
                          onKeyDown={handleInputKeyDown}
                          className="absolute inset-0 w-full h-full p-2 border-none outline-none bg-white dark:bg-slate-800 z-20 rounded-none"
                          autoFocus
                        />
                      ) : (
                        <span className="block truncate">{String(row[column.field] || '')}</span>
                      )}
                    </div>
                  ))}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80">
        <div>
          {sortedData.length} rows
        </div>
        <div className="flex items-center">
          <span>Ready to export to Tally</span>
          <div className="ml-2 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse-subtle"></div>
        </div>
      </div>
    </motion.div>
  );
};

export default DataGrid;
