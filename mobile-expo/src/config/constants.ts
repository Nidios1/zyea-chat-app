import Constants from 'expo-constants';

// Get API URL from app.json extra config or use default
// This allows easy configuration for different environments
const getApiUrl = (): string => {
  // Priority 1: Use value from app.json extra config
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  
  // Priority 2: Use environment variable (for EAS Build)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Priority 3: Fallback to default (development)
  // ⚠️ IMPORTANT: Update this to your production server URL before building IPA
  // For production, you should use:
  // - Your server's public IP address
  // - Or a domain name (e.g., https://api.yourdomain.com/api)
  // - Or a VPS/server URL (e.g., http://123.45.67.89:5000/api)
  return 'http://192.168.0.103:5000/api';
};

const getSocketUrl = (): string => {
  // Priority 1: Use value from app.json extra config
  if (Constants.expoConfig?.extra?.socketUrl) {
    return Constants.expoConfig.extra.socketUrl;
  }
  
  // Priority 2: Use environment variable (for EAS Build)
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }
  
  // Priority 3: Fallback to default (development)
  // ⚠️ IMPORTANT: Update this to your production server URL before building IPA
  return 'http://192.168.0.103:5000';
};

// API Configuration
export const API_BASE_URL = getApiUrl();

// Socket Configuration
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

