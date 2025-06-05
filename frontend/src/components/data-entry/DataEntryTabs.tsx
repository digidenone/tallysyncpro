
import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Database, Eye } from 'lucide-react';

interface DataEntryTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DataEntryTabs: React.FC<DataEntryTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="flex justify-center"
    >
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-md p-1"
      >
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger 
            value="import" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-light/20 data-[state=active]:to-teal-light/20 data-[state=active]:text-purple data-[state=active]:shadow-none"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>Import & Edit</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="process" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-light/20 data-[state=active]:to-teal-light/20 data-[state=active]:text-purple data-[state=active]:shadow-none"
          >
            <div className="flex items-center gap-2">
              <Database size={16} />
              <span>Process Data</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-light/20 data-[state=active]:to-teal-light/20 data-[state=active]:text-purple data-[state=active]:shadow-none"
          >
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>XML Preview</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </motion.div>
  );
};

export default DataEntryTabs;
