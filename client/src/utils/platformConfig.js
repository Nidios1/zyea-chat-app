// Platform detection and configuration for web app

/**
 * Detect if running on native app (always false for web)
 */
export const isNativeApp = () => {
  return false;
};

/**
 * Get current platform (always 'web')
 */
export const getPlatform = () => {
  return 'web';
};

/**
 * Get API Base URL based on environment
 * Priority:
 * 1. Environment variable (REACT_APP_API_URL)
 * 2. Default server IP
 */
export const getApiBaseUrl = () => {
  // Check if env variable is set
  if (process.env.REACT_APP_API_URL) {
    console.log('📡 Using API URL from env:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }

  // Default API URL
  const defaultApiUrl = 'http://192.168.0.104:5000/api';
  
  console.log('🌐 Running on web browser');
  console.log('📡 Using API URL:', defaultApiUrl);
  
  return defaultApiUrl;
};

/**
 * Get Socket URL
 */
export const getSocketUrl = () => {
  // Check if env variable is set
  if (process.env.REACT_APP_SOCKET_URL) {
    console.log('🔌 Using Socket URL from env:', process.env.REACT_APP_SOCKET_URL);
    return process.env.REACT_APP_SOCKET_URL;
  }

  // Development mode - use localhost
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Using Socket URL: http://localhost:5000');
    return 'http://localhost:5000';
  }

  // Production
  const defaultSocketUrl = 'http://192.168.0.104:5000';
  
  console.log('🌐 Web - Socket URL:', defaultSocketUrl);
  
  return defaultSocketUrl;
};

/**
 * Check if HTTPS is required (not required for web)
 */
export const isHttpsRequired = () => {
  return false;
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
  isNative: false,
  platform: 'web',
  apiUrl: getApiBaseUrl(),
  socketUrl: getSocketUrl(),
  uploadUrl: getUploadUrl(),
  httpsRequired: false,
};

// Log configuration on import (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Platform Configuration:', platformConfig);
}

export default platformConfig;
