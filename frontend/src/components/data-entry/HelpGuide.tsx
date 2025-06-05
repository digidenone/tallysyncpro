
import React from 'react';
import { motion } from 'framer-motion';
import { Book } from 'lucide-react';

const HelpGuide = () => {
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
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="glass-card p-5 sm:p-6 shadow-lg border-purple/10"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      transition={{ delay: 0.4 }}
    >
      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Book size={18} className="text-purple" />
        Help Guide
      </h3>
      <motion.ul
        variants={staggerContainerVariants}
        className="text-sm space-y-3.5 text-slate-600 dark:text-slate-400"
      >
        <motion.li variants={fadeInVariants} className="flex items-start">
          <div className="flex items-center justify-center bg-gradient-to-br from-purple/10 to-teal-light/10 text-purple rounded-full h-6 w-6 mt-0.5 mr-3 flex-shrink-0">1</div>
          <span>Import your Excel or PDF file using the importer above</span>
        </motion.li>
        <motion.li variants={fadeInVariants} className="flex items-start">
          <div className="flex items-center justify-center bg-gradient-to-br from-purple/10 to-teal-light/10 text-purple rounded-full h-6 w-6 mt-0.5 mr-3 flex-shrink-0">2</div>
          <span>Review and edit the data in the grid</span>
        </motion.li>
        <motion.li variants={fadeInVariants} className="flex items-start">
          <div className="flex items-center justify-center bg-gradient-to-br from-purple/10 to-teal-light/10 text-purple rounded-full h-6 w-6 mt-0.5 mr-3 flex-shrink-0">3</div>
          <span>The application will auto-detect ledgers and voucher types from your data</span>
        </motion.li>
        <motion.li variants={fadeInVariants} className="flex items-start">
          <div className="flex items-center justify-center bg-gradient-to-br from-purple/10 to-teal-light/10 text-purple rounded-full h-6 w-6 mt-0.5 mr-3 flex-shrink-0">4</div>
          <span>Choose to either download XML for manual import or sync directly via ODBC</span>
        </motion.li>
      </motion.ul>
      
      <div className="mt-6 p-3 bg-gradient-to-r from-purple-light/5 to-teal-light/5 rounded-lg border border-purple/10 text-xs text-slate-600 dark:text-slate-400">
        <p className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
          <strong>Tip:</strong> Use the tabs above to switch between importing data, processing, and previewing XML.
        </p>
      </div>
    </motion.div>
  );
};

export default HelpGuide;
