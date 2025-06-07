# 🏗️ TallySyncPro - Project Structure

## 📁 Repository Overview

```
tallysyncpro/
├── 📦 build/                          # Build scripts and configuration
│   ├── build-installer.bat            # Main installer build script
│   ├── verify-build-setup.bat         # Prerequisites verification
│   ├── start-tallysyncpro.bat         # Quick development start
│   ├── installer.nsh                  # NSIS installer script (legacy)
│   └── LICENSE                        # License file for installer
├── 🛠️ InnoSetup/                      # Windows installer configuration
│   ├── TallySyncPro.iss               # InnoSetup script 
│   ├── License.txt                    # License text for installer
│   ├── PreInstall-Info.txt            # Pre-installation info
│   ├── PostInstall-Info.txt           # Post-installation info
│   └── README.md                      # Installer documentation
├── 📱 frontend/                       # React TypeScript frontend
│   ├── src/                          # Source code
│   ├── public/                       # Static assets
│   │   └── downloads/                # Excel templates and resources
│   ├── package.json                  # Frontend dependencies
│   └── vite.config.ts                # Vite build configuration
├── 🖥️ src/                           # Node.js backend services
│   ├── services/                     # Business logic services
│   ├── config/                       # Configuration files
│   └── main.js                       # Main entry point
├── 📚 docs/                          # Documentation
├── 🎨 assets/                        # Application assets
│   ├── splash.html                   # Splash screen
│   ├── icon.ico                      # Application icon
│   └── TallySyncPro.exe.manifest     # Application manifest
├── ⚙️ electron-main.js               # Electron main process
├── 🔒 electron-preload.js            # Electron preload script
├── 📋 package.json                   # Root dependencies
└── 📖 README.md                      # Project overview
```

## 🎯 Core Architecture

### Electron Application Structure
- **Main Process**: `electron-main.js` - Window management and system integration
- **Renderer Process**: `frontend/` - React UI with TypeScript
- **Preload Script**: `electron-preload.js` - Secure IPC communication
- **Backend Services**: `src/` - Node.js business logic

### Frontend Architecture (React + TypeScript)
```
frontend/src/
├── 🧩 components/                     # Reusable UI components
│   ├── common/                       # Shared components
│   ├── data/                         # Data management components
│   ├── data-entry/                   # Import/export functionality
│   ├── forms/                        # Form components
│   ├── guides/                       # Help and documentation
│   ├── layout/                       # Layout components
│   └── ui/                           # Base UI components
├── 📄 pages/                         # Main application pages
├── 🔌 services/                      # Frontend services
├── 🎣 hooks/                         # Custom React hooks
├── 📝 types/                         # TypeScript type definitions
├── 🔧 config/                        # Configuration files
├── 🛠️ utils/                         # Utility functions
└── 📱 App.tsx                        # Main application component
```

### Backend Services (Node.js)
```
src/
├── 🔧 services/                      # Core business services
│   ├── tally.service.js              # Tally ERP integration
│   ├── excel.service.js              # Excel file processing
│   ├── database.service.js           # Database operations
│   ├── logging.service.js            # Application logging
│   ├── bug-report.service.js         # Error reporting
│   ├── dashboard.service.js          # Dashboard data
│   ├── frontend-api.service.js       # API endpoints
│   └── service-manager.js            # Service orchestration
├── ⚙️ config/                        # Configuration management
│   ├── app.config.js                 # Application settings
│   └── database.config.js            # Database configuration
├── 🧩 components/                    # Shared components
│   └── splash-screen.js              # Startup splash
└── 🚀 main.js                        # Application entry point
```

## 🔧 Build System

### Build Scripts Location
All build-related scripts are centralized in the `build/` directory:

#### `build/verify-build-setup.bat`
- Checks Node.js and npm versions
- Verifies all dependencies are installed
- Validates build environment
- Reports any missing prerequisites

#### `build/build-installer.bat`
- Builds frontend React application
- Packages Electron application (creates TallySyncPro.exe)
- Output: `dist-electron/win-unpacked/TallySyncPro.exe`
- Ready for InnoSetup compilation

### InnoSetup Configuration
The `InnoSetup/` directory contains:
- **TallySyncPro.iss**: Main installer script
- **License.txt**: End-user license agreement
- **PreInstall-Info.txt**: Information shown before installation
- **PostInstall-Info.txt**: Setup completion guide

### Build Output Structure
```
dist-electron/
├── win-unpacked/                     # Unpacked Electron app
│   ├── TallySyncPro.exe             # Main executable
│   ├── resources/                   # Application resources
│   ├── locales/                     # Electron locales
│   └── *.dll, *.pak, *.dat         # Electron dependencies
└── TallySyncPro.exe          # Electron Builder output

# After InnoSetup compilation:
# TallySyncPro.exe                   # Final installer (64-bit)
```

#### `build/installer.nsh`
- NSIS installer configuration
- Installation wizard settings
- File associations and shortcuts
- Uninstaller configuration

#### `build/start-tallysyncpro.bat`
- Quick development startup script
- Starts both backend and frontend
- Useful for development and testing

### Build Process Flow
1. **Dependency Check**: `verify-build-setup.bat`
2. **Frontend Build**: React TypeScript compilation
3. **Backend Preparation**: Node.js service bundling
4. **Electron Packaging**: Application packaging
5. **Installer Creation**: NSIS installer generation

## 📦 Dependencies & Technologies

### Core Technologies
- **Electron**: Desktop application framework
- **React 18+**: Frontend UI framework
- **TypeScript**: Type-safe JavaScript
- **Node.js**: Backend runtime
- **Vite**: Frontend build tool

### Frontend Dependencies
- **React Router**: Navigation
- **Framer Motion**: Animations
- **Tailwind CSS**: Styling framework
- **Lucide React**: Icon library
- **React Hook Form**: Form management

### Backend Dependencies
- **Express**: Web framework
- **ExcelJS**: Excel file processing
- **ODBC**: Database connectivity
- **Winston**: Logging framework
- **Node-cron**: Task scheduling

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript Compiler**: Type checking
- **Electron Builder**: Application packaging

## 🔄 Development Workflow

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/digidenone/tallysyncpro.git
cd tallysyncpro

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start development
npm run dev
```

### Development Scripts
- `npm run dev` - Start development mode
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Code linting
- `npm run format` - Code formatting

### File Organization Principles

#### Component Structure
```javascript
components/
├── ComponentName/
│   ├── ComponentName.tsx         # Main component
│   ├── ComponentName.test.tsx    # Unit tests
│   ├── ComponentName.stories.tsx # Storybook stories
│   └── index.ts                  # Export file
```

#### Service Structure
```javascript
services/
├── ServiceName.js                # Service implementation
├── ServiceName.test.js           # Service tests
└── ServiceName.config.js         # Service configuration
```

## 🔐 Security Architecture

### IPC Communication
- **Secure Context Isolation**: Preload script for safe IPC
- **Limited API Exposure**: Only necessary functions exposed
- **Input Validation**: All IPC messages validated

### Data Handling
- **Local Processing**: All data stays on user machine
- **Encrypted Storage**: Sensitive configuration encrypted
- **Audit Trail**: Complete operation logging

### External Connections
- **HTTPS Only**: Secure external communications
- **Certificate Validation**: SSL/TLS verification
- **Tally ODBC**: Direct database connection

## 📊 Configuration Management

### Application Configuration
- **Environment Variables**: Runtime configuration
- **User Preferences**: Stored in local config files
- **Default Settings**: Fallback configuration values

### Tally Integration Settings
- **Connection Parameters**: Server, port, company
- **ODBC Configuration**: Database connection strings
- **Import Settings**: Validation rules, batch sizes

## 🧪 Testing Strategy

### Test Structure
```
tests/
├── unit/                         # Unit tests
├── integration/                  # Integration tests
├── e2e/                         # End-to-end tests
└── fixtures/                    # Test data
```

### Testing Tools
- **Jest**: Unit testing framework
- **Testing Library**: React component testing
- **Playwright**: End-to-end testing
- **MSW**: API mocking

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports for components
- **Lazy Loading**: On-demand component loading
- **Bundle Analysis**: Build size optimization
- **Memoization**: React performance optimization

### Backend Optimization
- **Connection Pooling**: Efficient database connections
- **Caching**: Frequently accessed data caching
- **Streaming**: Large file processing
- **Memory Management**: Garbage collection optimization

## 🚀 Deployment Pipeline

### Build Pipeline
1. **Code Quality**: Linting and formatting checks
2. **Testing**: Automated test execution
3. **Building**: Production build creation
4. **Packaging**: Electron application packaging
5. **Distribution**: Installer creation and signing

### Release Process
1. **Version Bumping**: Semantic versioning
2. **Changelog Generation**: Automated release notes
3. **Asset Creation**: Build artifacts generation
4. **GitHub Release**: Automated release creation
5. **Distribution**: Installer publishing

---

*This project structure ensures maintainability, scalability, and ease of development for the TallySyncPro application.*
