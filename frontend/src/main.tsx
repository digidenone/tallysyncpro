
/**
 * TallySyncPro - Application Entry Point
 * 
 * This file serves as the main entry point for the React application.
 * It handles:
 * - React DOM mounting and rendering
 * - Progressive Web App (PWA) meta tags setup
 * - Mobile-responsive viewport configuration
 * - Theme color meta tag for mobile browsers
 * - Global CSS imports and styling setup
 * 
 * The application uses React 18+ with createRoot for improved performance
 * and concurrent features support.
 * 
 * @version 1.0.0
 * @author Digidenone
 * @license MIT
 */

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Progressive Web App Configuration
// Set theme color for mobile browsers (status bar color on mobile devices)
const metaThemeColor = document.createElement('meta');
metaThemeColor.name = 'theme-color';
metaThemeColor.content = '#f8fafc'; // Light theme default - matches Tailwind slate-50
document.head.appendChild(metaThemeColor);

// Mobile-First Responsive Design Configuration
// Ensure proper viewport handling across all devices and screen sizes
const metaViewport = document.createElement('meta');
metaViewport.name = 'viewport';
metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
document.head.appendChild(metaViewport);

// Render the React Application
// Mount the App component to the DOM root element with React 18+ createRoot
createRoot(document.getElementById("root")!).render(<App />);
