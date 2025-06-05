
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Download, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DataSummaryProps {
  data: any[];
}

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];

const DataSummary: React.FC<DataSummaryProps> = ({ data }) => {
  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!data.length) return { totalRows: 0, totalAmount: 0, categories: [], statusCounts: [] };
    
    const totalAmount = data.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    
    // Count categories
    const categoryMap = new Map();
    data.forEach(row => {
      const category = row.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    const categories = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5); // Top 5 categories
    
    // Count statuses
    const statusMap = new Map();
    data.forEach(row => {
      const status = row.status || 'Pending';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    const statusCounts = Array.from(statusMap.entries())
      .map(([name, value]) => ({ name, value }));
    
    return {
      totalRows: data.length,
      totalAmount,
      categories,
      statusCounts
    };
  }, [data]);

  const downloadChart = (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return;
    
    toPng(chartRef.current, { quality: 0.95 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
        toast.success('Chart downloaded successfully');
      })
      .catch((err) => {
        console.error('Error downloading chart:', err);
        toast.error('Failed to download chart');
      });
  };

  const barChartRef = React.createRef<HTMLDivElement>();
  const pieChartRef = React.createRef<HTMLDivElement>();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!data.length) {
    return (
      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
        <BarChart3 className="mx-auto h-12 w-12 opacity-30 mb-2" />
        <p>Import data to view summary statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div 
          className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Entries</div>
          <div className="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-200">
            {summary.totalRows.toLocaleString()}
          </div>
        </motion.div>
        
        <motion.div 
          className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Amount</div>
          <div className="text-3xl font-bold mt-1 text-purple">
            {formatCurrency(summary.totalAmount)}
          </div>
        </motion.div>
        
        <motion.div 
          className="p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 sm:col-span-2 lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400">Status</div>
          <div className="flex gap-3 mt-2">
            {summary.statusCounts.map((status, i) => (
              <div 
                key={i} 
                className="flex-1 text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {status.name}
                </div>
                <div className="text-lg font-bold text-purple">{status.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
              Categories
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadChart(barChartRef, 'categories-chart.png')}
              className="flex items-center gap-1"
            >
              <Download size={14} />
              <span>Export</span>
            </Button>
          </div>
          
          <div ref={barChartRef} className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary.categories}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700/50" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs fill-slate-500 dark:fill-slate-400"
                  tick={{ fontSize: 12 }}
                />
                <YAxis className="fill-slate-500 dark:fill-slate-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'  
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="value" name="Count" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
              Status Distribution
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadChart(pieChartRef, 'status-chart.png')}
              className="flex items-center gap-1"
            >
              <Download size={14} />
              <span>Export</span>
            </Button>
          </div>
          
          <div ref={pieChartRef} className="mt-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.statusCounts}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {summary.statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} entries`, 'Count']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'  
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DataSummary;
