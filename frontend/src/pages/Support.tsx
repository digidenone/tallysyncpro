import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, BookOpen, MessageSquare, Youtube, Mail, 
  FileText, Lightbulb, BookMarked, FileQuestion,
  ChevronRight, ExternalLink, Coffee, Download, Settings
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AppLayout from '@/components/layout/AppLayout';
import MobileWarning from '@/components/MobileWarning';
import DocumentationViewer from '@/components/guides/DocumentationViewer';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
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

const Support = () => {
  const [showDocumentation, setShowDocumentation] = useState(false);

  if (showDocumentation) {
    return (
      <AppLayout>
        <MobileWarning />
        <div className="container-desktop-only spacing-desktop-section">
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDocumentation(false)}
              className="mb-4"
            >
              ← Back to Support
            </Button>
          </div>
          <DocumentationViewer />
        </div>      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <MobileWarning />
      <div className="container-desktop-only spacing-desktop-section">
      <motion.div 
        className="flex justify-between items-center gap-4 bg-gradient-to-r from-purple-light/10 via-teal-light/5 to-purple-light/10 p-5 rounded-xl border border-slate-200 dark:border-slate-700/30 shadow-md"
        initial="hidden"
        animate="visible"
        variants={fadeInUpVariants}
      >
        <div className="space-y-1">
          <h1 className="gradient-heading text-desktop-xl flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-purple-light" />
            Help & Support
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Find answers, guides, and get support for Tally Converter
          </p>
        </div>        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline"
            size="sm"
            className="btn-mobile flex items-center gap-1.5 shadow-sm hover:shadow bg-white dark:bg-slate-800"
            onClick={() => setShowDocumentation(true)}
          >
            <BookMarked size={15} />
            <span>Documentation</span>
          </Button>
        </div>
      </motion.div>        <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-xl mx-auto mb-4 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">          <TabsTrigger 
            value="setup" 
            className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm cursor-pointer data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
          >
            <span>Setup Guide</span>
          </TabsTrigger>
          <TabsTrigger 
            value="faq" 
            className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm cursor-pointer data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
          >
            <span>FAQ</span>
          </TabsTrigger>
          <TabsTrigger 
            value="contact" 
            className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-md transition-all duration-200 hover:bg-white hover:shadow-sm cursor-pointer data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"          >
            <span>Contact</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup">
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple" />
                TallySync Pro Setup Guide
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Configure your TallySync Pro desktop application for Tally ERP integration
              </p>
            </div>              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Setup Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Setup Steps
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Configure Tally ERP ODBC</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Enable ODBC Server in Tally ERP 9 by going to Gateway of Tally → F11 (Features) → 
                        Company Features → set "Enable ODBC" to Yes.
                      </p>
                      <ul className="mt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                        <li>• Default Port: 9000</li>
                        <li>• Make sure Tally is running when using TallySync Pro</li>
                        <li>• Company should be loaded in Tally</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Launch TallySync Pro</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Open the TallySync Pro desktop application. The application includes integrated 
                        Tally connectivity and doesn't require any separate background services.
                      </p>
                      <div className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 p-2 rounded border-l-4 border-blue-400">
                        <strong>Note:</strong> TallySync Pro connects directly to Tally through its integrated service.
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Test Connection</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Go to Settings in TallySync Pro and test the connection to ensure Tally ERP 
                        is properly connected and accessible.
                      </p>
                      <div className="mt-2">
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/settings'}>
                          <Settings className="h-4 w-4 mr-2" />
                          Open Settings
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                {/* Troubleshooting */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-red-600" />
                  Troubleshooting
                </h3>
                
                <Accordion type="single" collapsible>
                  <AccordionItem value="trouble-1">
                    <AccordionTrigger className="text-left">
                      TallySync Pro cannot connect to Tally ERP
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Ensure Tally ERP is running and ODBC is enabled</li>
                        <li>• Check if the company is loaded in Tally</li>
                        <li>• Verify Windows Firewall isn't blocking the connection</li>
                        <li>• Make sure port 9000 is not used by another application</li>
                        <li>• Restart both Tally ERP and TallySync Pro if connection fails</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="trouble-2">
                    <AccordionTrigger className="text-left">
                      Data import errors
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Use the provided Excel templates for proper formatting</li>
                        <li>• Check date formats match Tally's expected format</li>
                        <li>• Ensure all required fields are filled</li>
                        <li>• Verify company is selected and loaded in Tally</li>
                        <li>• Check for duplicate entries that might cause conflicts</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="trouble-3">
                    <AccordionTrigger className="text-left">
                      Application performance issues
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Close other applications to free up system resources</li>
                        <li>• Ensure your system meets the minimum requirements</li>
                        <li>• Check available disk space for data processing</li>
                        <li>• Consider processing large datasets in smaller batches</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>          </motion.div>
        </TabsContent>
        
        <TabsContent value="faq">
          <motion.div 
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-purple" />
                Frequently Asked Questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="divide-y divide-slate-200 dark:divide-slate-700">
              <AccordionItem value="item-1" className="border-none px-4">
                <AccordionTrigger className="py-4 text-left">
                  What file formats can I import into Tally Converter?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  <p>
                    Tally Converter supports multiple file formats for import:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Excel files (.xlsx, .xls)</li>
                    <li>CSV files (.csv)</li>
                    <li>PDF files with tabular data (.pdf)</li>
                  </ul>
                  <p className="mt-2">
                    For optimal results, we recommend using Excel or CSV formats as they provide better data structure recognition.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border-none px-4">
                <AccordionTrigger className="py-4 text-left">
                  How do I connect Tally Converter to my Tally ERP?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  <p>
                    To connect to your Tally ERP, follow these steps:
                  </p>
                  <ol className="list-decimal pl-6 mt-2 space-y-2">
                    <li>Ensure Tally ERP is running on your computer</li>
                    <li>Open the Settings panel in Tally Converter</li>
                    <li>Enter your Tally server details (usually localhost:9000)</li>
                    <li>Specify your company name exactly as it appears in Tally</li>
                    <li>Click "Test Connection" to verify the connection</li>
                  </ol>
                  <p className="mt-2">
                    Note: Tally must have XML interface enabled in its configuration.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border-none px-4">
                <AccordionTrigger className="py-4 text-left">
                  Why does the application auto-detect ledgers and voucher types?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  <p>
                    Tally Converter uses machine learning algorithms to analyze your data and automatically detect:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Ledger names from your customer or party fields</li>
                    <li>Appropriate voucher types based on transaction patterns</li>
                    <li>Date formats and financial periods</li>
                  </ul>
                  <p className="mt-2">
                    This auto-detection feature saves time and reduces errors by pre-configuring the most likely mapping between your data and Tally's required format. You can always override these suggestions if needed.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border-none px-4">
                <AccordionTrigger className="py-4 text-left">
                  What should I do if I get data validation errors?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  <p>
                    When you encounter data validation errors:
                  </p>
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>Go to the Data Verification page to see detailed error reports</li>
                    <li>Fix critical errors (highlighted in red) before proceeding</li>
                    <li>Review warnings (in yellow) to ensure data accuracy</li>
                    <li>Use the "Fix" button next to each error for automated correction when available</li>
                    <li>Re-run verification after making changes</li>
                  </ol>
                  <p className="mt-2">
                    Common errors include invalid GSTIN numbers, date format issues, and missing required fields like party names or amounts.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border-none px-4">
                <AccordionTrigger className="py-4 text-left">
                  Can I use this tool without an internet connection?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  <p>
                    Yes, Tally Converter works in offline mode with certain limitations:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>You can import data from local files</li>
                    <li>XML generation works without internet connection</li>
                    <li>Direct Tally integration requires only local network (not internet)</li>
                    <li>Cloud import features require internet connection</li>
                  </ul>
                  <p className="mt-2">
                    The application automatically switches to offline mode when no internet connection is detected.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border-none px-4">
                <AccordionTrigger className="py-4 text-left">
                  How can I handle GST-related entries in Tally?
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  <p>
                    For GST entries in Tally:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>Ensure your data includes GSTIN numbers for parties</li>
                    <li>Include appropriate tax rates or amounts in your data</li>
                    <li>Enable the "Process GST entries" option in the advanced configuration</li>
                    <li>The application will automatically create proper GST ledger entries in Tally</li>
                    <li>Use the verification feature to validate GST calculations</li>
                  </ul>
                  <p className="mt-2">
                    Note: GST processing requires the correct tax ledgers to be already set up in your Tally.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
              Can't find an answer? Contact our support team for assistance.
            </div>
          </motion.div>        </TabsContent>
        
        <TabsContent value="contact">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple" />
                  Get in Touch
                </CardTitle>
                <CardDescription>
                  Reach out to our support team for assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-slate-600 dark:text-slate-400">
                  Our support team is available Monday through Friday, 9am to 6pm IST.
                  We typically respond to all inquiries within 24 hours.
                </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <Mail className="h-8 w-8 text-purple mx-auto mb-3" />
                    <h3 className="font-medium mb-1">Email Support</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">chiragnahata05@gmail.com</p>
                  </div>
                  
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <MessageSquare className="h-8 w-8 text-purple mx-auto mb-3" />
                    <h3 className="font-medium mb-1">Phone Support</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">+91 7439661385</p>
                  </div>
                  
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
                    <HelpCircle className="h-8 w-8 text-purple mx-auto mb-3" />
                    <h3 className="font-medium mb-1">Support by</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Digidenone</p>
                  </div>
                </div>              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
};

export default Support;
