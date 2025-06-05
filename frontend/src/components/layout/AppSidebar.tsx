
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { FileText, Database, Settings, ChevronRight, FileSpreadsheet, FileCheck, HelpCircle, Sparkles, Download, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { Badge } from '@/components/ui/badge';

const Icon = ({ name, className, ...props }: { name: string, className?: string, [key: string]: unknown }) => {  const icons: Record<string, React.FC<{ className?: string }>> = {
    'database': Database,
    'file': FileText,
    'file-spreadsheet': FileSpreadsheet,
    'file-check': FileCheck,
    'settings': Settings,
    'sparkles': Sparkles,
    'help': HelpCircle,
    'download': Download,
    'book-open': BookOpen,
  };

  const LucideIcon = icons[name] || Database;
  return <LucideIcon className={cn("h-5 w-5", className)} {...props} />;
};

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: 'sparkles',
    description: 'Main dashboard and control center'
  },
  {
    title: 'Data Entry',
    path: '/data-entry',
    icon: 'file-spreadsheet',
    description: 'Import Excel data with automatic verification and convert to Tally format'
  },
  {
    title: 'Tally Setup Guide',
    path: '/tally-guide',
    icon: 'book-open',
    description: 'Configure Tally ODBC connection for integration'
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: 'settings',
    description: 'Configure Tally connection'
  },  {
    title: 'Help & Support',
    path: '/support',
    icon: 'help',
    description: 'Get help and support for the application'
  },
  {
    title: 'About',
    path: '/about',
    icon: 'file',
    description: 'Application info, version, and development team'
  }
];

const AppSidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 flex items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple to-teal-light flex items-center justify-center text-white font-bold">
            <Sparkles size={18} />
          </div>          <div>
            <div className="font-bold text-slate-800 dark:text-slate-200">TallySyncPro</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              by Digidenone
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                v1.0
              </Badge>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <SidebarTrigger className="lg:hidden">
            <ChevronRight size={20} />
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 py-2">
            Main Menu
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-md transition-all relative group overflow-hidden",
                        isActive(item.path) 
                          ? "bg-gradient-to-r from-purple-light/20 to-teal-light/10 text-purple font-medium dark:from-purple-light/30 dark:to-teal-light/20 dark:text-purple-light"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon 
                          name={item.icon} 
                          className={cn(
                            isActive(item.path) ? "text-purple-light" : "text-slate-500 dark:text-slate-400 group-hover:text-purple-light/70",
                            "transition-colors"
                          )}
                        />
                        <span>{item.title}</span>
                      </div>
                      
                      {isActive(item.path) && (
                        <motion.div 
                          className="absolute bottom-0 left-0 h-0.5 bg-purple-light"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </Link>
                  </SidebarMenuButton>
                  <div className="pl-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
        <div className="flex flex-col items-center justify-center space-y-2">          <div className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-light/10 to-teal-light/10 text-center">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">TallySyncPro</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">© 2025 Digidenone. All rights reserved</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
