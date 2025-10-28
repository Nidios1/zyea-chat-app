import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Theme mode: 'light', 'dark', or 'system'
  // Mặc định là 'light' khi chưa có trong localStorage (user mới)
  const [themeMode, setThemeMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light'; // Default to 'light' for new users
  });

  // Actual dark mode state (computed from themeMode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme color: 'classic', 'blue', 'dreamy', 'natural'
  const [themeColor, setThemeColor] = useState(() => {
    const savedColor = localStorage.getItem('themeColor');
    return savedColor || 'classic';
  });

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      if (themeMode === 'system') {
        setIsDarkMode(e.matches);
      }
    };

    // Set initial value
    if (themeMode === 'system') {
      setIsDarkMode(mediaQuery.matches);
    } else {
      setIsDarkMode(themeMode === 'dark');
    }

    // Add listener
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themeMode]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-color', themeColor);
    
    // Update meta theme-color for mobile status bar
    const themeColorMeta = document.querySelector('#theme-color-default');
    if (themeColorMeta) {
      themeColorMeta.content = isDarkMode ? '#1c1c1e' : '#ffffff';
    }
    
    // Update apple-mobile-web-app-status-bar-style
    const statusBarStyleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarStyleMeta) {
      statusBarStyleMeta.content = isDarkMode ? 'black-translucent' : 'default';
    }
  }, [isDarkMode, themeColor]);

  // Save theme mode to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Save theme color to localStorage
  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
  }, [themeColor]);

  const toggleTheme = () => {
    setThemeMode(prevMode => {
      if (prevMode === 'light') return 'dark';
      if (prevMode === 'dark') return 'system';
      return 'light';
    });
  };

  const setTheme = (mode) => {
    setThemeMode(mode);
  };

  const setColor = (color) => {
    setThemeColor(color);
  };

  const value = {
    isDarkMode,
    themeMode,
    themeColor,
    toggleTheme,
    setTheme,
    setColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
