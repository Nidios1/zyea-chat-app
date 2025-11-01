import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, StatusBar, AppState, AppStateStatus, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PWATheme } from '../config/PWATheme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  colors: typeof PWATheme.light;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track system dark mode state for real-time updates
  // Handle null case - if systemColorScheme is null (some platforms), default to light
  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(
    systemColorScheme !== null && systemColorScheme !== undefined 
      ? systemColorScheme === 'dark' 
      : false
  );

  // Function to get current system color scheme directly from Appearance API
  const getSystemColorScheme = (): 'light' | 'dark' => {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  };

  // Function to update system dark mode state from actual system theme
  const updateSystemDarkMode = () => {
    const currentScheme = getSystemColorScheme();
    const isSystemDark = currentScheme === 'dark';
    console.log('🌓 Checking system color scheme:', {
      fromHook: systemColorScheme,
      fromAppearance: currentScheme,
      isDark: isSystemDark
    });
    setSystemDarkMode(isSystemDark);
    return isSystemDark;
  };

  // Listen to system color scheme changes in real-time
  useEffect(() => {
    // Update when system color scheme changes (iOS/Android system settings)
    // Use both useColorScheme hook and Appearance API for better accuracy
    updateSystemDarkMode();
  }, [systemColorScheme]);

  // Also listen to Appearance changes directly
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('🎨 Appearance API detected theme change:', colorScheme);
      const isSystemDark = colorScheme === 'dark';
      setSystemDarkMode(isSystemDark);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Listen to app state changes to update theme when app returns from background
  // This ensures theme updates when system theme changed while app was in background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && themeMode === 'system') {
        // When app becomes active and theme mode is 'system', 
        // refresh system color scheme to pick up any changes
        console.log('📱 App resumed, refreshing system theme...');
        updateSystemDarkMode();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [themeMode]);

  // Load theme mode from storage (only once on mount)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setThemeModeState(savedMode);
          console.log('📱 Loaded theme mode from storage:', savedMode);
          
          // If loaded mode is 'system', immediately refresh system theme
          if (savedMode === 'system') {
            // Small delay to ensure Appearance API is ready
            setTimeout(() => {
              updateSystemDarkMode();
            }, 100);
          }
        } else {
          console.log('📱 No saved theme mode, using default: system');
          // For default 'system' mode, also refresh
          setTimeout(() => {
            updateSystemDarkMode();
          }, 100);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadTheme();
  }, []); // Only run once on mount

  // Save theme mode to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
      
      // If switching to 'system' mode, immediately refresh system theme
      if (mode === 'system') {
        console.log('🔄 Switching to system mode, refreshing theme...');
        updateSystemDarkMode();
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Compute actual dark mode based on theme mode and system preference
  // Use systemDarkMode state for real-time updates when system theme changes
  const isDarkMode = themeMode === 'system' 
    ? systemDarkMode
    : themeMode === 'dark';

  // Debug logging
  useEffect(() => {
    console.log('🎨 Theme updated:', {
      themeMode,
      systemColorScheme,
      systemDarkMode,
      isDarkMode,
      colors: isDarkMode ? 'dark' : 'light'
    });
  }, [themeMode, systemColorScheme, systemDarkMode, isDarkMode]);

  // Get colors based on current mode
  const colors = isDarkMode ? PWATheme.dark : PWATheme.light;

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const value: ThemeContextType = {
    themeMode,
    isDarkMode,
    colors,
    setThemeMode,
    toggleTheme,
  };

  // Don't render until theme is loaded
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
