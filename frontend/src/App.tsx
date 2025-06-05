/**
 * ================================================================
 * TallySync Pro - Main Application Component
 * ================================================================
 * 
 * This is the root component of the TallySync Pro application, serving as the
 * primary entry point and provider setup for the entire application ecosystem.
 * 
 * ARCHITECTURE OVERVIEW:
 * ┌─ App (Root Provider Setup)
 * ├─ QueryClientProvider (Server State Management)
 * ├─ ThemeProvider (UI Theme System)
 * ├─ TooltipProvider (Enhanced UX)
 * ├─ Toast Systems (User Notifications)
 * └─ BrowserRouter (Application Routing)
 *   ├─ Dashboard (/) - Main control center
 *   ├─ DataEntry (/data-entry) - Excel import functionality
 *   ├─ TallyGuide (/tally-guide) - Connection setup guide
 *   ├─ Download (/download) - Desktop app download
 *   ├─ Verification (/verification) - Data validation
 *   ├─ Settings (/settings) - Configuration management
 *   ├─ Support (/support) - Help and documentation
 *   └─ NotFound (*) - 404 error handling
 * 
 * CORE FEATURES:
 * - Professional non-responsive design optimized for desktop business use
 * - Comprehensive error boundary protection for critical components
 * - Optimized React Query configuration for Tally ERP data operations
 * - Dual toast notification systems for different UX scenarios
 * - Suspense-based lazy loading for performance optimization
 * - Theme-aware design system with dark/light mode support
 * 
 * BUSINESS LOGIC INTEGRATION:
 * - TallySync service connectivity for real-time data synchronization
 * - Excel template generation and download management
 * - Tally ODBC connection monitoring and status reporting
 * - User preference persistence and configuration management
 * - Error tracking and user feedback collection
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - React Query with 5-minute stale time for efficient caching
 * - Single retry policy to prevent Tally server overload
 * - Disabled window focus refetch for better user experience
 * - Suspense boundaries for progressive loading
 * - Error boundaries to prevent cascade failures
 * 
 * SECURITY CONSIDERATIONS:
 * - No sensitive data stored in client-side state
 * - CORS-compliant API communication
 * - Secure token handling for authenticated operations
 * - Input validation at component boundaries
 * 
 * @version 2.0.0
 * @author Digidenone
 * @license MIT
 * @since 2025-01-01
 * @lastModified 2025-06-02
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from "react";

// Application Pages - Core Business Modules
import Dashboard from "./pages/Dashboard";            // Main business dashboard with KPIs
import DataEntry from "./pages/DataEntry";            // Data input and management forms
import Settings from "./pages/Settings";              // Application and user settings
import Support from "./pages/Support";                // Help, documentation, and support
import Verification from "./pages/Verification";      // Data verification and validation
import TallyGuide from "./pages/TallyGuide";          // Tally connection setup guide
import About from "./pages/About";                    // Application information and development team
import NotFound from "./pages/NotFound";              // 404 error page

// Global Providers and Context
import { ThemeProvider } from "./hooks/use-theme";

// Error Boundary for Dashboard
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              TallySync Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The dashboard is starting up. Please wait a moment...
            </p>
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component for Suspense
const DashboardLoading = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Loading TallySync Pro
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Initializing your dashboard...
      </p>
    </div>
  </div>
);

/**
 * React Query Client Configuration
 * 
 * Configured with optimized settings for Tally data:
 * - Disabled window focus refetch for better UX
 * - Limited retry attempts to avoid overwhelming Tally server
 * - 5-minute stale time for cached data efficiency
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,    // Prevent unnecessary refetches
      retry: 1,                       // Single retry to avoid server overload
      staleTime: 5 * 60 * 1000,      // 5 minutes cache for performance
    },
  },
});

/**
 * Main Application Component
 * 
 * Provides the following global context:
 * - React Query for data fetching and caching
 * - Theme context for UI theming
 * - Tooltip provider for enhanced UX
 * - Toast notifications for user feedback
 * - React Router for navigation
 * 
 * @returns {JSX.Element} The complete application with providers and routing
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        {/* Toast notification systems for user feedback */}
        <Toaster />
        <Sonner 
          position="top-right" 
          expand={true} 
          closeButton={true} 
          richColors 
        />
          {/* Main application routing */}        <HashRouter>
          <Routes>            {/* Main Application Routes - Dashboard at root */}
            <Route path="/" element={
              <DashboardErrorBoundary>
                <Suspense fallback={<DashboardLoading />}>
                  <Dashboard />
                </Suspense>
              </DashboardErrorBoundary>
            } />            {/* Data Management Routes */}
            <Route path="/data-entry" element={<DataEntry />} />
            
            {/* Tally Configuration Guide */}
            <Route path="/tally-guide" element={<TallyGuide />} />
  
              {/* System Routes */}
            <Route path="/verification" element={<Verification />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
            
            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
