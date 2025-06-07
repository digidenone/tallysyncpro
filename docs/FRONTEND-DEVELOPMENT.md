# 🎨 Frontend Development Guide

This guide covers React frontend development for the TallySyncPro desktop application.

## 📋 Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Electron Integration](#electron-integration)
- [UI/UX Guidelines](#uiux-guidelines)
- [Performance Optimization](#performance-optimization)
- [Testing Strategy](#testing-strategy)

## 🛠️ Technology Stack

### Core Technologies
- **React 18** - UI library with hooks and concurrent features
- **TypeScript** - Type safety and better developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Reusable component library
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Vitest** - Unit testing
- **Playwright** - E2E testing

## 🏗️ Project Structure

```
frontend/
├── 📄 index.html              # HTML template
├── 📄 vite.config.ts          # Vite configuration
├── 📄 tailwind.config.ts      # Tailwind CSS config
├── 📄 tsconfig.json           # TypeScript config
├── 📄 package.json            # Dependencies
├── 📁 public/                 # Static assets
│   ├── favicon.ico
│   └── icons/
├── 📁 src/
│   ├── 📄 main.tsx            # React entry point
│   ├── 📄 App.tsx             # Main App component
│   ├── 📄 index.css           # Global styles
│   ├── 📁 components/         # Reusable components
│   │   ├── 📁 ui/             # Base UI components
│   │   ├── 📁 forms/          # Form components
│   │   ├── 📁 tables/         # Data table components
│   │   ├── 📁 charts/         # Chart components
│   │   └── 📁 layout/         # Layout components
│   ├── 📁 pages/              # Page components
│   │   ├── ConnectionPage.tsx
│   │   ├── ImportPage.tsx
│   │   ├── ExportPage.tsx
│   │   └── SettingsPage.tsx
│   ├── 📁 hooks/              # Custom React hooks
│   │   ├── useTallyConnection.ts
│   │   ├── useDataImport.ts
│   │   └── useAppSettings.ts
│   ├── 📁 services/           # API services
│   │   ├── tallyService.ts
│   │   ├── excelService.ts
│   │   └── electronService.ts
│   ├── 📁 stores/             # State management
│   │   ├── connectionStore.ts
│   │   ├── dataStore.ts
│   │   └── uiStore.ts
│   ├── 📁 types/              # TypeScript types
│   │   ├── tally.ts
│   │   ├── excel.ts
│   │   └── app.ts
│   ├── 📁 utils/              # Utility functions
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   └── 📁 assets/             # Local assets
│       ├── images/
│       └── icons/
├── 📁 tests/                  # Test files
│   ├── 📁 components/
│   ├── 📁 pages/
│   └── 📁 e2e/
└── 📁 dist/                   # Build output
```

## 💻 Development Setup

### Environment Configuration
```bash
# .env.development
VITE_DEV_SERVER=true
VITE_API_URL=http://localhost:3001
VITE_ELECTRON_MODE=true
VITE_TALLY_HOST=localhost
VITE_TALLY_PORT=9000
VITE_LOG_LEVEL=debug
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "vite --port 5173 --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\""
  }
}
```

### Hot Module Replacement Setup
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      port: 5174,
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

## 🧩 Component Architecture

### Base Component Structure
```typescript
// components/ui/Button.tsx
import React from 'react';
import { cn } from '@/utils/cn';
import { VariantProps, cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Form Components
```typescript
// components/forms/TallyConnectionForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { useTallyConnection } from '@/hooks/useTallyConnection';

const connectionSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1, 'Port must be greater than 0').max(65535, 'Invalid port number'),
  company: z.string().min(1, 'Company name is required'),
  username: z.string().optional(),
  password: z.string().optional(),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

export const TallyConnectionForm: React.FC = () => {
  const { connect, isConnecting, connectionStatus } = useTallyConnection();
  
  const form = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      host: 'localhost',
      port: 9000,
      company: '',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: ConnectionFormData) => {
    try {
      await connect(data);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tally Host</FormLabel>
                <FormControl>
                  <Input placeholder="localhost" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="9000" 
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} />
            <span className="text-sm text-muted-foreground">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </span>
          </div>
          
          <Button type="submit" disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

## 🗄️ State Management

### Connection Store
```typescript
// stores/connectionStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConnectionState {
  host: string;
  port: number;
  company: string;
  username: string;
  password: string;
  isConnected: boolean;
  lastConnected: string | null;
  connectionHistory: Array<{
    host: string;
    port: number;
    company: string;
    timestamp: string;
  }>;
}

interface ConnectionActions {
  updateConnection: (config: Partial<ConnectionState>) => void;
  setConnected: (connected: boolean) => void;
  addToHistory: (connection: { host: string; port: number; company: string }) => void;
  clearHistory: () => void;
  reset: () => void;
}

const initialState: ConnectionState = {
  host: 'localhost',
  port: 9000,
  company: '',
  username: '',
  password: '',
  isConnected: false,
  lastConnected: null,
  connectionHistory: [],
};

export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      updateConnection: (config) => {
        set((state) => ({ ...state, ...config }));
      },
      
      setConnected: (connected) => {
        set((state) => ({
          ...state,
          isConnected: connected,
          lastConnected: connected ? new Date().toISOString() : null,
        }));
      },
      
      addToHistory: (connection) => {
        set((state) => {
          const newEntry = {
            ...connection,
            timestamp: new Date().toISOString(),
          };
          
          const filteredHistory = state.connectionHistory.filter(
            (item) => !(item.host === connection.host && 
                       item.port === connection.port && 
                       item.company === connection.company)
          );
          
          return {
            ...state,
            connectionHistory: [newEntry, ...filteredHistory].slice(0, 10),
          };
        });
      },
      
      clearHistory: () => {
        set((state) => ({ ...state, connectionHistory: [] }));
      },
      
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'tally-connection-store',
      partialize: (state) => ({
        host: state.host,
        port: state.port,
        company: state.company,
        connectionHistory: state.connectionHistory,
      }),
    }
  )
);
```

### Data Store
```typescript
// stores/dataStore.ts
import { create } from 'zustand';
import { TallyVoucher, TallyMaster, ImportResult } from '@/types/tally';

interface DataState {
  vouchers: TallyVoucher[];
  masters: TallyMaster[];
  importResults: ImportResult[];
  isLoading: boolean;
  error: string | null;
  selectedVouchers: string[];
  filters: {
    dateFrom: string;
    dateTo: string;
    voucherType: string;
    ledgerName: string;
  };
}

interface DataActions {
  setVouchers: (vouchers: TallyVoucher[]) => void;
  setMasters: (masters: TallyMaster[]) => void;
  addImportResult: (result: ImportResult) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedVouchers: (ids: string[]) => void;
  updateFilters: (filters: Partial<DataState['filters']>) => void;
  clearData: () => void;
}

export const useDataStore = create<DataState & DataActions>((set) => ({
  vouchers: [],
  masters: [],
  importResults: [],
  isLoading: false,
  error: null,
  selectedVouchers: [],
  filters: {
    dateFrom: '',
    dateTo: '',
    voucherType: '',
    ledgerName: '',
  },
  
  setVouchers: (vouchers) => set({ vouchers }),
  setMasters: (masters) => set({ masters }),
  addImportResult: (result) => set((state) => ({ 
    importResults: [result, ...state.importResults] 
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedVouchers: (ids) => set({ selectedVouchers: ids }),
  updateFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  clearData: () => set({
    vouchers: [],
    masters: [],
    selectedVouchers: [],
    error: null,
  }),
}));
```

## 🔗 Electron Integration

### Electron Service
```typescript
// services/electronService.ts
import { TallyConnectionConfig, TallyVoucher, TallyMaster } from '@/types/tally';

class ElectronService {
  private get tallyAPI() {
    if (typeof window === 'undefined' || !window.tallyAPI) {
      throw new Error('Electron API not available');
    }
    return window.tallyAPI;
  }

  async testConnection(config: TallyConnectionConfig) {
    return this.tallyAPI.testConnection(config);
  }

  async getConnectionStatus() {
    return this.tallyAPI.getConnectionStatus();
  }

  async importVouchers(vouchers: TallyVoucher[]) {
    return this.tallyAPI.importVouchers({ vouchers });
  }

  async exportVouchers(filters: any) {
    return this.tallyAPI.exportVouchers(filters);
  }

  async getMasters(type: string) {
    return this.tallyAPI.getMasters(type);
  }

  async selectFiles(options: any) {
    return this.tallyAPI.selectFiles(options);
  }

  async readExcelFile(filePath: string, options: any) {
    return this.tallyAPI.readExcelFile(filePath, options);
  }

  async saveConfig(config: any) {
    return this.tallyAPI.saveConfig(config);
  }

  async getConfig() {
    return this.tallyAPI.getConfig();
  }

  // Event listeners
  onConnectionStatusChange(callback: (status: any) => void) {
    this.tallyAPI.onConnectionStatusChange(callback);
  }

  onImportProgress(callback: (progress: any) => void) {
    this.tallyAPI.onImportProgress(callback);
  }

  removeListener(eventName: string) {
    this.tallyAPI.removeListener(eventName);
  }
}

export const electronService = new ElectronService();
```

### Custom Hooks
```typescript
// hooks/useTallyConnection.ts
import { useState, useEffect } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { electronService } from '@/services/electronService';
import { toast } from '@/components/ui/use-toast';

export const useTallyConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  const { host, port, company, username, password, setConnected, addToHistory } = useConnectionStore();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await electronService.getConnectionStatus();
        setConnectionStatus(status.connected ? 'connected' : 'disconnected');
        setConnected(status.connected);
      } catch (error) {
        console.error('Failed to check connection status:', error);
      }
    };

    checkStatus();

    // Listen for connection status changes
    electronService.onConnectionStatusChange((status) => {
      setConnectionStatus(status.connected ? 'connected' : 'disconnected');
      setConnected(status.connected);
    });

    return () => {
      electronService.removeListener('connection-status-changed');
    };
  }, [setConnected]);

  const connect = async (config?: any) => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      const connectionConfig = config || { host, port, company, username, password };
      const result = await electronService.testConnection(connectionConfig);
      
      if (result.success) {
        setConnectionStatus('connected');
        setConnected(true);
        addToHistory({ host: connectionConfig.host, port: connectionConfig.port, company: connectionConfig.company });
        toast({
          title: 'Connection Successful',
          description: `Connected to ${connectionConfig.company} at ${connectionConfig.host}:${connectionConfig.port}`,
        });
      } else {
        setConnectionStatus('disconnected');
        setConnected(false);
        toast({
          title: 'Connection Failed',
          description: result.message || 'Failed to connect to Tally server',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setConnected(false);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return {
    connect,
    isConnecting,
    connectionStatus,
  };
};
```

## 🎨 UI/UX Guidelines

### Design System
```typescript
// styles/theme.ts
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
};
```

### Responsive Design
```css
/* styles/responsive.css */
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  
  .mobile-stack {
    flex-direction: column;
  }
  
  .mobile-full-width {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .mobile-only {
    display: none;
  }
}
```

### Accessibility
```typescript
// components/AccessibleButton.tsx
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  ariaLabel,
  ariaDescribedBy,
  ariaPressed,
  children,
  ...props
}) => {
  return (
    <Button
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-pressed={ariaPressed}
      {...props}
    >
      {children}
    </Button>
  );
};
```

## ⚡ Performance Optimization

### Code Splitting
```typescript
// pages/index.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ConnectionPage = lazy(() => import('./ConnectionPage'));
const ImportPage = lazy(() => import('./ImportPage'));
const ExportPage = lazy(() => import('./ExportPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<ConnectionPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
};
```

### Virtual Scrolling
```typescript
// components/VirtualTable.tsx
import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TallyVoucher } from '@/types/tally';

interface VirtualTableProps {
  data: TallyVoucher[];
  height: number;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({ data, height }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const items = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-full w-full overflow-auto"
      style={{ height }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const voucher = data[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center px-4 border-b"
            >
              <span className="flex-1">{voucher.voucherNumber}</span>
              <span className="flex-1">{voucher.date}</span>
              <span className="flex-1">{voucher.voucherType}</span>
              <span className="flex-1">{voucher.amount}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// tests/components/TallyConnectionForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TallyConnectionForm } from '@/components/forms/TallyConnectionForm';
import { electronService } from '@/services/electronService';

// Mock the electron service
jest.mock('@/services/electronService', () => ({
  electronService: {
    testConnection: jest.fn(),
    onConnectionStatusChange: jest.fn(),
    removeListener: jest.fn(),
  },
}));

describe('TallyConnectionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<TallyConnectionForm />);
    
    expect(screen.getByLabelText('Tally Host')).toBeInTheDocument();
    expect(screen.getByLabelText('Port')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TallyConnectionForm />);
    
    const connectButton = screen.getByRole('button', { name: 'Connect' });
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
    });
  });

  it('calls electron service on form submission', async () => {
    const mockTestConnection = jest.mocked(electronService.testConnection);
    mockTestConnection.mockResolvedValue({ success: true });
    
    render(<TallyConnectionForm />);
    
    fireEvent.change(screen.getByLabelText('Company Name'), {
      target: { value: 'Test Company' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    
    await waitFor(() => {
      expect(mockTestConnection).toHaveBeenCalledWith({
        host: 'localhost',
        port: 9000,
        company: 'Test Company',
        username: '',
        password: '',
      });
    });
  });
});
```

### E2E Tests
```typescript
// tests/e2e/connection.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tally Connection', () => {
  test('should connect to Tally successfully', async ({ page }) => {
    await page.goto('/');
    
    // Fill connection form
    await page.fill('[data-testid="host-input"]', 'localhost');
    await page.fill('[data-testid="port-input"]', '9000');
    await page.fill('[data-testid="company-input"]', 'Test Company');
    
    // Click connect button
    await page.click('[data-testid="connect-button"]');
    
    // Verify connection status
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    
    // Verify navigation to import page is enabled
    await expect(page.locator('[data-testid="import-nav"]')).not.toBeDisabled();
  });

  test('should show error for invalid connection', async ({ page }) => {
    await page.goto('/');
    
    // Fill with invalid connection details
    await page.fill('[data-testid="host-input"]', 'invalid-host');
    await page.fill('[data-testid="port-input"]', '9999');
    await page.fill('[data-testid="company-input"]', 'Invalid Company');
    
    // Click connect button
    await page.click('[data-testid="connect-button"]');
    
    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
  });
});
```

## 📚 Best Practices

### Component Design
- Keep components small and focused
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow React hooks rules
- Use proper prop types and defaults

### State Management
- Keep state as close to usage as possible
- Use Zustand for global state
- Implement proper state normalization
- Handle loading and error states

### Performance
- Implement virtual scrolling for large lists
- Use React.memo for expensive components
- Optimize re-renders with useMemo and useCallback
- Implement proper code splitting

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain proper color contrast

---

**Next: [Testing Guide](TESTING.md)**
