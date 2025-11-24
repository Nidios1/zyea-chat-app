// Lazy import expo-constants to avoid TurboModule errors in Expo Go
let Constants: any = null;
let constantsInitialized = false;

const initConstants = () => {
  if (constantsInitialized) return;
  try {
    Constants = require('expo-constants').default || require('expo-constants');
  } catch (e) {
    console.warn('expo-constants not available, using fallback');
    Constants = {
      expoConfig: {
        extra: {},
      },
      appOwnership: 'expo',
    };
  }
  constantsInitialized = true;
};

// Cache URLs to avoid re-evaluation on every import
let cachedApiUrl: string | null = null;
let cachedSocketUrl: string | null = null;

// Get API URL from app.json extra config or use default
// This allows easy configuration for different environments
const getApiUrl = (): string => {
  // Return cached value if available
  if (cachedApiUrl !== null) {
    return cachedApiUrl;
  }

  // Initialize constants once
  initConstants();

  // Priority 1: Use value from app.json extra config
  try {
    if (Constants?.expoConfig?.extra?.apiUrl) {
      cachedApiUrl = Constants.expoConfig.extra.apiUrl;
      return cachedApiUrl;
    }
  } catch (e) {
    console.warn('Failed to read expoConfig.extra.apiUrl:', e);
  }
  
  // Priority 2: Use environment variable (for EAS Build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    cachedApiUrl = process.env.EXPO_PUBLIC_API_URL;
    return cachedApiUrl;
  }
  
  // Priority 3: Fallback to default (development)
  // ⚠️ IMPORTANT: Update this to your production server URL before building IPA
  // For production, you should use:
  // - Your server's public IP address
  // - Or a domain name (e.g., https://api.yourdomain.com/api)
  // - Or a VPS/server URL (e.g., http://123.45.67.89:5000/api)
  cachedApiUrl = 'http://192.168.0.103:5000/api';
  return cachedApiUrl;
};

const getSocketUrl = (): string => {
  // Return cached value if available
  if (cachedSocketUrl !== null) {
    return cachedSocketUrl;
  }

  // Initialize constants once
  initConstants();

  // Priority 1: Use value from app.json extra config
  try {
    if (Constants?.expoConfig?.extra?.socketUrl) {
      cachedSocketUrl = Constants.expoConfig.extra.socketUrl;
      return cachedSocketUrl;
    }
  } catch (e) {
    console.warn('Failed to read expoConfig.extra.socketUrl:', e);
  }
  
  // Priority 2: Use environment variable (for EAS Build)
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    cachedSocketUrl = process.env.EXPO_PUBLIC_SOCKET_URL;
    return cachedSocketUrl;
  }
  
  // Priority 3: Fallback to default (development)
  // ⚠️ IMPORTANT: Update this to your production server URL before building IPA
  cachedSocketUrl = 'http://192.168.0.103:5000';
  return cachedSocketUrl;
};

// API Configuration - Initialize immediately for faster access
export const API_BASE_URL = getApiUrl();

// Socket Configuration - Initialize immediately for faster access
export const SOCKET_URL = getSocketUrl();

// App Configuration
export const APP_NAME = 'Zyea+';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@user_data',
  THEME: '@theme_preference',
  LANGUAGE: '@language_preference',
};

// Cache Keys
export const CACHE_KEYS = {
  CONVERSATIONS: 'conversations',
  FRIENDS: 'friends',
  POSTS: 'posts',
  NOTIFICATIONS: 'notifications',
};

