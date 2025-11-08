import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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
  // Initialize with Appearance API as primary source (more reliable on iOS)
  const initialSystemDark = (() => {
    const appearanceScheme = Appearance.getColorScheme();
    if (appearanceScheme === 'dark' || appearanceScheme === 'light') {
      // Use Appearance API as primary source
      return appearanceScheme === 'dark';
    }
    // Fallback to hook if Appearance API returns null
    if (systemColorScheme === 'dark') return true;
    if (systemColorScheme === 'light') return false;
    // Default to false if both return null
    return false;
  })();
  
  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(initialSystemDark);

  // Function to get current system color scheme
  // Priority: Appearance API > useColorScheme hook (more reliable on iOS)
  const getSystemColorScheme = (): 'light' | 'dark' => {
    // First, try Appearance API (more reliable on iOS, especially when Remote Debugging is enabled)
    const appearanceScheme = Appearance.getColorScheme();
    if (appearanceScheme === 'dark' || appearanceScheme === 'light') {
      return appearanceScheme;
    }
    // Fallback to useColorScheme hook
    if (systemColorScheme === 'dark' || systemColorScheme === 'light') {
      return systemColorScheme;
    }
    // Default to light if both return null
    return 'light';
  };

  // Function to update system dark mode state from actual system theme
  // On iOS, Appearance.getColorScheme() is more reliable than useColorScheme hook
  // especially when Remote Debugging is enabled (which can cause useColorScheme to always return 'light')
  const updateSystemDarkMode = () => {
    // Get both values
    const hookValue = systemColorScheme;
    const appearanceValue = Appearance.getColorScheme();
    
    // Priority: Appearance API > useColorScheme hook
    // This is because Appearance API is more reliable on iOS, especially when Remote Debugging is enabled
    let finalIsDark = false;
    
    if (appearanceValue === 'dark' || appearanceValue === 'light') {
      // Use Appearance API as primary source (more reliable on iOS)
      finalIsDark = appearanceValue === 'dark';
    } else if (hookValue === 'dark' || hookValue === 'light') {
      // Fallback to hook if Appearance API returns null
      finalIsDark = hookValue === 'dark';
    }
    // If both return null, keep current value (default to false/light)
    
    console.log('🌓 Checking system color scheme:', {
      fromHook: hookValue,
      fromAppearance: appearanceValue,
      finalIsDark,
      finalDecision: finalIsDark ? 'dark' : 'light',
      note: 'Using Appearance API as primary source (more reliable on iOS)'
    });
    
    setSystemDarkMode(finalIsDark);
    return finalIsDark;
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

  // Force update system theme when themeMode changes to 'system' or systemColorScheme changes
  useEffect(() => {
    if (themeMode === 'system') {
      // Force update system theme immediately when switching to system mode
      // On iOS, Appearance API is more reliable than useColorScheme hook
      // (especially when Remote Debugging is enabled)
      const appearanceScheme = Appearance.getColorScheme();
      const hookValue = systemColorScheme;
      
      // Priority: Appearance API > useColorScheme hook
      let finalIsDark = false;
      
      if (appearanceScheme === 'dark' || appearanceScheme === 'light') {
        // Use Appearance API as primary source
        finalIsDark = appearanceScheme === 'dark';
      } else if (hookValue === 'dark' || hookValue === 'light') {
        // Fallback to hook if Appearance API returns null
        finalIsDark = hookValue === 'dark';
      }
      
      console.log('🔄 Theme mode is system, updating:', {
        fromHook: hookValue,
        fromAppearance: appearanceScheme,
        finalIsDark,
        currentSystemDarkMode: systemDarkMode,
        note: 'Using Appearance API as primary source'
      });
      
      // Always update to ensure sync with system theme
      setSystemDarkMode(finalIsDark);
    }
  }, [themeMode, systemColorScheme]); // Depend on both themeMode and systemColorScheme

  // Save theme mode to storage
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      // If switching to 'system' mode, update system theme FIRST before setting themeMode
      // This ensures isDarkMode is calculated correctly when themeMode changes
      if (mode === 'system') {
        console.log('🔄 Switching to system mode, refreshing theme...');
        // On iOS, Appearance API is more reliable than useColorScheme hook
        // (especially when Remote Debugging is enabled)
        const appearanceScheme = Appearance.getColorScheme();
        const hookValue = systemColorScheme;
        
        // Priority: Appearance API > useColorScheme hook
        let finalIsDark = false;
        
        if (appearanceScheme === 'dark' || appearanceScheme === 'light') {
          // Use Appearance API as primary source
          finalIsDark = appearanceScheme === 'dark';
        } else if (hookValue === 'dark' || hookValue === 'light') {
          // Fallback to hook if Appearance API returns null
          finalIsDark = hookValue === 'dark';
        }
        
        console.log('🔄 Immediate system theme update:', {
          fromHook: hookValue,
          fromAppearance: appearanceScheme,
          finalIsDark,
          note: 'Using Appearance API as primary source'
        });
        
        // Update systemDarkMode FIRST to ensure isDarkMode is calculated correctly
        setSystemDarkMode(finalIsDark);
      }
      
      await AsyncStorage.setItem('themeMode', mode);
      // Then update themeMode state
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Compute actual dark mode based on theme mode and system preference
  // Use systemDarkMode state for real-time updates when system theme changes
  // Use useMemo to ensure it recalculates when dependencies change
  const isDarkMode = useMemo(() => {
    if (themeMode === 'system') {
      return systemDarkMode;
    }
    return themeMode === 'dark';
  }, [themeMode, systemDarkMode]);

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
  // Use useMemo to ensure it recalculates when isDarkMode changes
  const colors = useMemo(() => {
    return isDarkMode ? PWATheme.dark : PWATheme.light;
  }, [isDarkMode]);

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
