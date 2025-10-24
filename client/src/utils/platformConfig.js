// Platform detection and configuration for PWA vs Native App
import { Capacitor } from '@capacitor/core';

/**
 * Detect if running on Capacitor native app or web
 */
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Get current platform (ios, android, web)
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};

/**
 * Get API Base URL based on platform and environment
 * Priority:
 * 1. Environment variable (REACT_APP_API_URL)
 * 2. Localhost for development
 * 3. Default server IP for production
 */
export const getApiBaseUrl = () => {
  // Check if env variable is set
  if (process.env.REACT_APP_API_URL) {
    console.log('📡 Using API URL from env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // Always use full URL (proxy has issues)
  const defaultApiUrl = 'http://192.168.0.102:5000/api';
  
  if (isNativeApp()) {
    console.log('📱 Running on native app, platform:', getPlatform());
    console.log('📡 Using API URL:', defaultApiUrl);
  } else {
    console.log('🌐 Running on web browser');
    console.log('📡 Using API URL:', defaultApiUrl);
  }
  
  return defaultApiUrl;
};

/**
 * Get Socket URL based on platform
 */
export const getSocketUrl = () => {
  // Check if env variable is set
  if (process.env.REACT_APP_SOCKET_URL) {
    console.log('🔌 Using Socket URL from env:', process.env.REACT_APP_SOCKET_URL);
    return process.env.REACT_APP_SOCKET_URL;
  }

  // Development mode - use localhost
  if (process.env.NODE_ENV === 'development' && !isNativeApp()) {
    console.log('🔌 Using Socket URL: http://localhost:5000');
    return 'http://localhost:5000';
  }

  // Native app or production
  const defaultSocketUrl = 'http://192.168.0.102:5000';
  
  if (isNativeApp()) {
    console.log('📱 Native app - Socket URL:', defaultSocketUrl);
  } else {
    console.log('🌐 Web - Socket URL:', defaultSocketUrl);
  }
  
  return defaultSocketUrl;
};

/**
 * Check if HTTPS is required (iOS native apps prefer HTTPS)
 */
export const isHttpsRequired = () => {
  return isNativeApp() && getPlatform() === 'ios';
};

/**
 * Get upload URL for images/files
 */
export const getUploadUrl = () => {
  const apiUrl = getApiBaseUrl();
  // Remove /api suffix if present
  const baseUrl = apiUrl.replace(/\/api$/, '');
  return `${baseUrl}/uploads`;
};

/**
 * Platform-specific configurations
 */
export const platformConfig = {
  isNative: isNativeApp(),
  platform: getPlatform(),
  apiUrl: getApiBaseUrl(),
  socketUrl: getSocketUrl(),
  uploadUrl: getUploadUrl(),
  httpsRequired: isHttpsRequired(),
};

// Log configuration on import (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Platform Configuration:', platformConfig);
}

export default platformConfig;

