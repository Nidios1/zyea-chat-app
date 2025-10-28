import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../config/theme';

interface ThemeContextType {
  isDarkMode: boolean;
  theme: typeof lightTheme;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to system preference
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setThemeLoaded(true);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    saveThemePreference(newValue);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
    saveThemePreference(value);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (!themeLoaded) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme,
        toggleTheme,
        setDarkMode,
      }}
    >
      {children}
      </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

