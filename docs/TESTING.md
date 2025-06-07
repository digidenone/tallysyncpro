# 🧪 Testing Guide

This guide covers testing strategies and practices for the TallySyncPro desktop application.

## 📋 Table of Contents

- [Testing Overview](#testing-overview)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Manual Testing](#manual-testing)
- [Test Data Management](#test-data-management)

## 🔍 Testing Overview

### Testing Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                         │
├─────────────────────────────────────────────────────────────┤
│  E2E Tests (5%)                                            │
│  ├── Electron Integration Tests                            │
│  ├── Full User Workflow Tests                              │
│  └── Cross-Platform Tests                                  │
├─────────────────────────────────────────────────────────────┤
│  Integration Tests (20%)                                   │
│  ├── IPC Communication Tests                               │
│  ├── ODBC Connection Tests                                  │
│  ├── File Operation Tests                                   │
│  └── Component Integration Tests                           │
├─────────────────────────────────────────────────────────────┤
│  Unit Tests (75%)                                          │
│  ├── React Component Tests                                 │
│  ├── Custom Hook Tests                                     │
│  ├── Utility Function Tests                                │
│  ├── Service Tests                                         │
│  └── Store Tests                                           │
└─────────────────────────────────────────────────────────────┘
```

### Test Tools Stack
- **Unit Testing**: Vitest, React Testing Library
- **E2E Testing**: Playwright, Spectron
- **Mocking**: MSW (Mock Service Worker)
- **Test Utilities**: @testing-library/jest-dom
- **Coverage**: c8 (built into Vitest)

## 🧪 Unit Testing

### Component Testing Setup
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron APIs
global.tallyAPI = {
  testConnection: vi.fn(),
  importVouchers: vi.fn(),
  exportVouchers: vi.fn(),
  getMasters: vi.fn(),
  onConnectionStatusChange: vi.fn(),
  removeListener: vi.fn(),
};

global.appInfo = {
  version: '2.0.0',
  name: 'TallySync Pro',
  platform: 'win32',
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Testing Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Component Test Examples

#### Form Component Test
```typescript
// tests/components/TallyConnectionForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TallyConnectionForm } from '@/components/forms/TallyConnectionForm';

// Mock the custom hook
vi.mock('@/hooks/useTallyConnection', () => ({
  useTallyConnection: () => ({
    connect: vi.fn(),
    isConnecting: false,
    connectionStatus: 'disconnected',
  }),
}));

describe('TallyConnectionForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<TallyConnectionForm />);
    
    expect(screen.getByLabelText(/tally host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TallyConnectionForm />);
    
    const connectButton = screen.getByRole('button', { name: /connect/i });
    await user.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
    });
  });

  it('calls connect function with form data', async () => {
    const mockConnect = vi.fn();
    vi.mocked(useTallyConnection).mockReturnValue({
      connect: mockConnect,
      isConnecting: false,
      connectionStatus: 'disconnected',
    });
    
    render(<TallyConnectionForm />);
    
    await user.type(screen.getByLabelText(/host/i), 'localhost');
    await user.type(screen.getByLabelText(/port/i), '9000');
    await user.type(screen.getByLabelText(/company name/i), 'Test Company');
    
    await user.click(screen.getByRole('button', { name: /connect/i }));
    
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalledWith({
        host: 'localhost',
        port: 9000,
        company: 'Test Company',
        username: '',
        password: '',
      });
    });
  });

  it('disables form during connection', () => {
    vi.mocked(useTallyConnection).mockReturnValue({
      connect: vi.fn(),
      isConnecting: true,
      connectionStatus: 'connecting',
    });
    
    render(<TallyConnectionForm />);
    
    expect(screen.getByRole('button', { name: /connecting/i })).toBeDisabled();
  });
});
```

#### Hook Test
```typescript
// tests/hooks/useTallyConnection.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useTallyConnection } from '@/hooks/useTallyConnection';

// Mock the electron service
vi.mock('@/services/electronService', () => ({
  electronService: {
    testConnection: vi.fn(),
    getConnectionStatus: vi.fn(),
    onConnectionStatusChange: vi.fn(),
    removeListener: vi.fn(),
  },
}));

describe('useTallyConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useTallyConnection());
    
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(typeof result.current.connect).toBe('function');
  });

  it('handles successful connection', async () => {
    const mockTestConnection = vi.mocked(electronService.testConnection);
    mockTestConnection.mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useTallyConnection());
    
    await act(async () => {
      await result.current.connect({
        host: 'localhost',
        port: 9000,
        company: 'Test Company',
      });
    });
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('connected');
    });
  });

  it('handles connection failure', async () => {
    const mockTestConnection = vi.mocked(electronService.testConnection);
    mockTestConnection.mockResolvedValue({ 
      success: false, 
      message: 'Connection failed' 
    });
    
    const { result } = renderHook(() => useTallyConnection());
    
    await act(async () => {
      await result.current.connect({
        host: 'invalid-host',
        port: 9999,
        company: 'Invalid Company',
      });
    });
    
    await waitFor(() => {
      expect(result.current.connectionStatus).toBe('disconnected');
    });
  });
});
```

#### Store Test
```typescript
// tests/stores/connectionStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useConnectionStore } from '@/stores/connectionStore';

describe('connectionStore', () => {
  beforeEach(() => {
    // Reset store state
    useConnectionStore.getState().reset();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useConnectionStore());
    
    expect(result.current.host).toBe('localhost');
    expect(result.current.port).toBe(9000);
    expect(result.current.company).toBe('');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionHistory).toEqual([]);
  });

  it('updates connection config', () => {
    const { result } = renderHook(() => useConnectionStore());
    
    act(() => {
      result.current.updateConnection({
        host: 'tally-server',
        port: 9001,
        company: 'ABC Company',
      });
    });
    
    expect(result.current.host).toBe('tally-server');
    expect(result.current.port).toBe(9001);
    expect(result.current.company).toBe('ABC Company');
  });

  it('adds connection to history', () => {
    const { result } = renderHook(() => useConnectionStore());
    
    act(() => {
      result.current.addToHistory({
        host: 'localhost',
        port: 9000,
        company: 'Test Company',
      });
    });
    
    expect(result.current.connectionHistory).toHaveLength(1);
    expect(result.current.connectionHistory[0]).toMatchObject({
      host: 'localhost',
      port: 9000,
      company: 'Test Company',
    });
  });
});
```

## 🔗 Integration Testing

### IPC Communication Tests
```typescript
// tests/integration/ipc.test.ts
import { ipcMain, ipcRenderer } from 'electron';
import { vi } from 'vitest';

describe('IPC Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles tally connection requests', async () => {
    const mockConfig = {
      host: 'localhost',
      port: 9000,
      company: 'Test Company',
    };
    
    // Mock IPC handler
    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    ipcMain.handle('tally-test-connection', mockHandler);
    
    // Simulate renderer request
    const result = await ipcRenderer.invoke('tally-test-connection', mockConfig);
    
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), mockConfig);
    expect(result).toEqual({ success: true });
  });

  it('handles error responses gracefully', async () => {
    const mockError = new Error('Connection failed');
    const mockHandler = vi.fn().mockRejectedValue(mockError);
    ipcMain.handle('tally-test-connection', mockHandler);
    
    await expect(
      ipcRenderer.invoke('tally-test-connection', {})
    ).rejects.toThrow('Connection failed');
  });
});
```

### ODBC Integration Tests
```typescript
// tests/integration/odbc.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import odbc from 'odbc';

describe('ODBC Integration', () => {
  let connection: any;

  beforeEach(async () => {
    // Use test database connection
    const connectionString = process.env.TEST_ODBC_CONNECTION_STRING;
    if (connectionString) {
      connection = await odbc.connect(connectionString);
    }
  });

  afterEach(async () => {
    if (connection) {
      await connection.close();
    }
  });

  it('connects to test database', async () => {
    if (!connection) {
      expect.skip('ODBC connection not available');
      return;
    }
    
    expect(connection).toBeDefined();
  });

  it('executes simple query', async () => {
    if (!connection) {
      expect.skip('ODBC connection not available');
      return;
    }
    
    const result = await connection.query('SELECT 1 as test');
    expect(result).toHaveLength(1);
    expect(result[0].test).toBe(1);
  });
});
```

## 🎭 End-to-End Testing

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: { 
        ...devices['Desktop Chrome'],
        // Custom Electron configuration
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples
```typescript
// tests/e2e/connection-workflow.spec.ts
import { test, expect } from '@playwright/test';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['.'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

test.describe('Connection Workflow', () => {
  test('should complete full connection flow', async () => {
    // Navigate to connection page
    await page.goto('/');
    
    // Fill connection form
    await page.fill('[data-testid="host-input"]', 'localhost');
    await page.fill('[data-testid="port-input"]', '9000');
    await page.fill('[data-testid="company-input"]', 'Test Company');
    
    // Submit connection
    await page.click('[data-testid="connect-button"]');
    
    // Verify success state
    await expect(page.locator('[data-testid="connection-status"]'))
      .toHaveText('Connected');
      
    // Verify navigation is enabled
    await expect(page.locator('[data-testid="import-nav"]'))
      .not.toBeDisabled();
  });

  test('should handle invalid connection gracefully', async () => {
    await page.goto('/');
    
    // Fill with invalid data
    await page.fill('[data-testid="host-input"]', 'invalid-host');
    await page.fill('[data-testid="port-input"]', '9999');
    await page.fill('[data-testid="company-input"]', 'Invalid Company');
    
    await page.click('[data-testid="connect-button"]');
    
    // Verify error state
    await expect(page.locator('[data-testid="error-message"]'))
      .toBeVisible();
  });
});
```

## ⚡ Performance Testing

### Component Performance Tests
```typescript
// tests/performance/component-performance.test.tsx
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { VirtualTable } from '@/components/VirtualTable';

describe('Component Performance', () => {
  it('renders large dataset efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      voucherNumber: `V${i.toString().padStart(6, '0')}`,
      date: '2024-01-01',
      voucherType: 'Sales',
      amount: Math.random() * 10000,
    }));
    
    const startTime = performance.now();
    
    render(<VirtualTable data={largeDataset} height={400} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

### Memory Usage Tests
```typescript
// tests/performance/memory.test.ts
import { test, expect } from '@playwright/test';

test('memory usage remains stable', async ({ page }) => {
  await page.goto('/');
  
  // Get initial memory usage
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // Perform memory-intensive operations
  for (let i = 0; i < 100; i++) {
    await page.click('[data-testid="refresh-data"]');
    await page.waitForTimeout(50);
  }
  
  // Force garbage collection
  await page.evaluate(() => {
    if ((window as any).gc) {
      (window as any).gc();
    }
  });
  
  // Check final memory usage
  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  const memoryIncrease = finalMemory - initialMemory;
  
  // Memory increase should be reasonable (less than 50MB)
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
});
```

## 🔒 Security Testing

### XSS Protection Tests
```typescript
// tests/security/xss.test.tsx
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/DataTable';

describe('XSS Protection', () => {
  it('sanitizes user input in data display', () => {
    const maliciousData = [
      {
        id: 1,
        name: '<script>alert("XSS")</script>',
        description: '<img src="x" onerror="alert(\'XSS\')" />',
      },
    ];
    
    render(<DataTable data={maliciousData} />);
    
    // Should not execute script
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
    expect(screen.getByText('alert("XSS")')).toBeInTheDocument();
  });
});
```

### Input Validation Tests
```typescript
// tests/security/validation.test.ts
import { validateConnectionConfig } from '@/utils/validators';

describe('Input Validation', () => {
  it('validates connection configuration', () => {
    const validConfig = {
      host: 'localhost',
      port: 9000,
      company: 'Test Company',
    };
    
    expect(validateConnectionConfig(validConfig)).toBe(true);
  });

  it('rejects invalid configuration', () => {
    const invalidConfigs = [
      { host: '', port: 9000, company: 'Test' }, // Empty host
      { host: 'localhost', port: 0, company: 'Test' }, // Invalid port
      { host: 'localhost', port: 9000, company: '' }, // Empty company
      { host: '../../../etc/passwd', port: 9000, company: 'Test' }, // Path traversal
    ];
    
    invalidConfigs.forEach(config => {
      expect(validateConnectionConfig(config)).toBe(false);
    });
  });
});
```

## 🧑‍💻 Manual Testing

### Test Checklist

#### Connection Testing
- [ ] Valid Tally connection succeeds
- [ ] Invalid connection shows appropriate error
- [ ] Connection timeout handled gracefully
- [ ] Reconnection after network interruption
- [ ] Multiple company connections

#### Data Operations
- [ ] Excel file import works correctly
- [ ] Large file handling (1000+ rows)
- [ ] Invalid data validation
- [ ] Progress indicators during operations
- [ ] Error handling and recovery

#### UI/UX Testing
- [ ] Responsive design on different screen sizes
- [ ] Accessibility with keyboard navigation
- [ ] Loading states and feedback
- [ ] Error messages are user-friendly
- [ ] Tooltips and help text

#### Performance Testing
- [ ] Application startup time < 5 seconds
- [ ] Large dataset rendering performance
- [ ] Memory usage remains stable
- [ ] File operations don't freeze UI

#### Security Testing
- [ ] No sensitive data in logs
- [ ] File access is restricted
- [ ] External URLs are validated
- [ ] User input is properly sanitized

## 📊 Test Data Management

### Test Data Structure
```typescript
// tests/fixtures/testData.ts
export const mockVouchers = [
  {
    voucherNumber: 'V000001',
    date: '2024-01-01',
    voucherType: 'Sales',
    amount: 1000.00,
    ledgerEntries: [
      { ledger: 'Customer A', amount: 1000.00 },
      { ledger: 'Sales Account', amount: -1000.00 },
    ],
  },
  // ... more test data
];

export const mockLedgers = [
  { name: 'Customer A', group: 'Sundry Debtors' },
  { name: 'Sales Account', group: 'Sales Accounts' },
  // ... more test data
];
```

### Test Database Setup
```sql
-- tests/fixtures/test-database.sql
CREATE TABLE test_vouchers (
  id INTEGER PRIMARY KEY,
  voucher_number VARCHAR(50),
  date DATE,
  voucher_type VARCHAR(50),
  amount DECIMAL(10,2)
);

INSERT INTO test_vouchers VALUES
(1, 'V000001', '2024-01-01', 'Sales', 1000.00),
(2, 'V000002', '2024-01-02', 'Purchase', 500.00);
```

## 📈 Test Reports

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
npm run test:coverage:open
```

### Performance Reports
```bash
# Run performance tests
npm run test:performance

# Generate performance report
npm run test:performance:report
```

### E2E Test Reports
```bash
# Run E2E tests with report
npm run test:e2e

# View test report
npm run test:e2e:report
```

---

**Related Documentation:**
- [Frontend Development Guide](FRONTEND-DEVELOPMENT.md)
- [Electron Development Guide](ELECTRON-DEVELOPMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
