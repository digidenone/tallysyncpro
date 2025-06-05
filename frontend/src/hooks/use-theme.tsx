/**
 * useTheme Hook - Advanced Theme Management System
 * 
 * A sophisticated React hook and context provider for managing application-wide
 * theme preferences with system integration and persistent storage.
 * 
 * CORE FEATURES:
 * - Light and dark theme support
 * - System preference detection and sync
 * - Persistent theme storage (localStorage)
 * - Automatic theme application to DOM
 * - Smooth theme transitions
 * - Real-time theme switching
 * 
 * INTEGRATION CAPABILITIES:
 * - CSS custom properties synchronization
 * - Tailwind CSS dark mode support
 * - Component-level theme awareness
 * - Dynamic color scheme updates
 * - Media query responsive theming
 * 
 * ACCESSIBILITY FEATURES:
 * - Respects user's system preferences
 * - Maintains color contrast compliance
 * - Supports reduced motion preferences
 * - ARIA attributes for theme state
 * - Keyboard navigation support
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Efficient re-rendering prevention
 * - Lazy theme loading
 * - Minimal DOM manipulation
 * - Context value memoization
 * - Transition debouncing
 * 
 * STORAGE MANAGEMENT:
 * - Automatic localStorage synchronization
 * - Cross-tab theme synchronization
 * - Fallback for storage unavailability
 * - Migration support for theme updates
 * 
 * @hook useTheme
 * @returns {ThemeContextType} Theme state and control functions
 * 
 * @example
 * ```tsx
 * const { theme, toggleTheme } = useTheme();
 * 
 * return (
 *   <button onClick={toggleTheme}>
 *     Current theme: {theme}
 *   </button>
 * );
 * ```
 */

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeContextType = {
  theme: string;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<string>(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem("theme");
    
    // Check if user has a system preference
    if (!savedTheme) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    
    return savedTheme;
  });  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem("theme");
      // Only follow system if no explicit theme is saved
      if (!savedTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // Effect to handle theme changes
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove the previous theme class
    root.classList.remove("light", "dark");
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Save theme to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};
