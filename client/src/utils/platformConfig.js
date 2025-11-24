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

  // Default API URL - luôn dùng IP WiFi để có thể truy cập từ các thiết bị khác
  // Tự động detect IP từ window.location nếu đang chạy trên IP WiFi
  // IP sẽ được sync từ network-config.js qua .env.local
  let defaultApiUrl = 'http://192.168.0.103:5000/api'; // Fallback - sẽ được sync-ip.js cập nhật
  
  // Nếu đang chạy trên IP WiFi (không phải localhost), dùng IP đó
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Nếu hostname là IP (192.168.x.x hoặc 10.x.x.x), dùng IP đó
    if (hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
      defaultApiUrl = `http://${hostname}:5000/api`;
      console.log('🌐 Detected WiFi IP from hostname:', hostname);
    }
  }
  
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

  // Luôn dùng IP WiFi để có thể truy cập từ các thiết bị khác
  // Tự động detect IP từ window.location nếu đang chạy trên IP WiFi
  // IP sẽ được sync từ network-config.js qua .env.local
  let defaultSocketUrl = 'http://192.168.0.103:5000'; // Fallback - sẽ được sync-ip.js cập nhật
  
  // Nếu đang chạy trên IP WiFi (không phải localhost), dùng IP đó
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Nếu hostname là IP (192.168.x.x hoặc 10.x.x.x), dùng IP đó
    if (hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)) {
      defaultSocketUrl = `http://${hostname}:5000`;
      console.log('🔌 Detected WiFi IP for Socket:', hostname);
    }
  }
  
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
