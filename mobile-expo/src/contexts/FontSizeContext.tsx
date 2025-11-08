import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FontSizeScale = 'small' | 'medium' | 'large' | 'extra-large';

interface FontSizeContextType {
  fontSizeScale: FontSizeScale;
  useSystemFontSize: boolean;
  setFontSizeScale: (scale: FontSizeScale) => void;
  setUseSystemFontSize: (use: boolean) => void;
  getFontSize: (baseSize: number) => number;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const useFontSize = (): FontSizeContextType => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};

interface FontSizeProviderProps {
  children: ReactNode;
}

// Font size multipliers based on scale
const FONT_SIZE_MULTIPLIERS: Record<FontSizeScale, number> = {
  'small': 0.85,
  'medium': 1.0,
  'large': 1.15,
  'extra-large': 1.3,
};

export const FontSizeProvider: React.FC<FontSizeProviderProps> = ({ children }) => {
  const [fontSizeScale, setFontSizeScaleState] = useState<FontSizeScale>('medium');
  const [useSystemFontSize, setUseSystemFontSizeState] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load font size settings from storage
  useEffect(() => {
    const loadFontSizeSettings = async () => {
      try {
        const savedScale = await AsyncStorage.getItem('fontSizeScale');
        const savedUseSystem = await AsyncStorage.getItem('useSystemFontSize');
        
        if (savedScale && ['small', 'medium', 'large', 'extra-large'].includes(savedScale)) {
          setFontSizeScaleState(savedScale as FontSizeScale);
        }
        
        if (savedUseSystem !== null) {
          setUseSystemFontSizeState(savedUseSystem === 'true');
        }
      } catch (error) {
        console.error('Error loading font size settings:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadFontSizeSettings();
  }, []);

  // Save font size scale to storage
  const setFontSizeScale = async (scale: FontSizeScale) => {
    try {
      await AsyncStorage.setItem('fontSizeScale', scale);
      setFontSizeScaleState(scale);
    } catch (error) {
      console.error('Error saving font size scale:', error);
    }
  };

  // Save use system font size to storage
  const setUseSystemFontSize = async (use: boolean) => {
    try {
      await AsyncStorage.setItem('useSystemFontSize', use.toString());
      setUseSystemFontSizeState(use);
    } catch (error) {
      console.error('Error saving use system font size:', error);
    }
  };

  // Get adjusted font size based on scale
  const getFontSize = (baseSize: number): number => {
    if (useSystemFontSize) {
      return baseSize; // Use system font size
    }
    const multiplier = FONT_SIZE_MULTIPLIERS[fontSizeScale];
    return Math.round(baseSize * multiplier);
  };

  const value: FontSizeContextType = {
    fontSizeScale,
    useSystemFontSize,
    setFontSizeScale,
    setUseSystemFontSize,
    getFontSize,
  };

  // Don't render until settings are loaded
  if (!isInitialized) {
    return null;
  }

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
};

export default FontSizeContext;

