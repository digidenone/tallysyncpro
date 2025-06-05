
/**
 * AppLayout Component
 * 
 * Main application layout wrapper that provides the structural foundation
 * for the TallySync Pro desktop application interface.
 * 
 * LAYOUT FEATURES:
 * - Professional desktop-centric design (non-responsive)
 * - Sidebar navigation with collapsible functionality
 * - Theme-aware styling with dark/light mode support
 * - Smooth animations and transitions using Framer Motion
 * - Fixed padding and spacing for consistent desktop experience
 * 
 * DESIGN SYSTEM:
 * - Fixed 32px (p-8) padding for consistent desktop spacing
 * - Gradient backgrounds for visual depth
 * - Meta theme color management for browser integration
 * - Professional business application aesthetics
 * 
 * RESPONSIVE BEHAVIOR:
 * - Designed specifically for desktop use (1024px+ screens)
 * - Fixed layout prevents mobile responsive adjustments
 * - Maintains consistent spacing regardless of screen size
 * 
 * INTEGRATION:
 * - SidebarProvider for navigation state management
 * - Theme provider integration for color scheme switching
 * - Motion wrapper for smooth page transitions
 * 
 * @component AppLayout
 * @param {React.ReactNode} children - Page content to render within layout
 * @author Digidenone
 * @version 1.0.0
 * @since 2024
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { useTheme } from '@/hooks/use-theme';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { theme } = useTheme();
  
  // Add meta theme color for mobile browsers
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === 'dark' ? '#0f172a' : '#f8fafc'
      );
    }
  }, [theme]);  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
        <AppSidebar />
        <motion.main 
          className="flex-1 p-8 overflow-x-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
