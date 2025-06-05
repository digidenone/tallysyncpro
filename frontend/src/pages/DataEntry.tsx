import React from 'react';
import AppLayout from '../components/layout/AppLayout';
import TallyDataEntry from '../components/data-entry/TallyDataEntry';
import MobileWarning from '../components/MobileWarning';
import { FileSpreadsheet } from 'lucide-react';
import { motion } from 'framer-motion';

const DataEntry = () => {
  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <AppLayout>
      <MobileWarning />
      <div className="w-full max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Enhanced Header Section */}
        <motion.div 
          className="relative overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariants}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl"></div>
          <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-8 rounded-2xl shadow-xl">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <FileSpreadsheet size={28} />
                  </div>                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                      Data Entry
                    </h1>
                    <p className="text-lg text-muted-foreground mt-1">
                      Professional Excel to Tally Integration
                    </p>
                  </div>
                </div>                <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                  Transform your Excel data into Tally-ready format with intelligent validation, 
                  automated error detection, and seamless integration capabilities.
                </p></div>
            </div>
          </div>
        </motion.div>        {/* Main Data Entry Component */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUpVariants}
          transition={{ delay: 0.2 }}        >
          <TallyDataEntry />
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default DataEntry;
