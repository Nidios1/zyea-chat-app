/**
 * Image URL utilities for web app
 */

/**
 * Get server URL based on environment
 */
export const getServerURL = () => {
  // For web, use environment variable or return empty for relative URLs
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_SERVER_URL || '';
  }
  
  // Development - use proxy or relative URLs
  return '';
};

/**
 * Get full image URL from relative path
 * @param {string} relativePath - Relative path like "/uploads/avatars/xxx.jpg"
 * @returns {string} Full URL or relative path
 */
export const getImageURL = (relativePath) => {
  if (!relativePath) return '';
  
  // Already a full URL
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // For web, return as-is (will be handled by proxy or served directly)
  return relativePath;
};

/**
 * Get avatar URL
 * @param {string} avatarPath - Avatar path from user object
 * @returns {string} Full avatar URL
 */
export const getAvatarURL = (avatarPath) => {
  return getImageURL(avatarPath);
};

/**
 * Get uploaded image URL (chat images, post images, etc.)
 * @param {string} imagePath - Image path
 * @returns {string} Full image URL
 */
export const getUploadedImageURL = (imagePath) => {
  return getImageURL(imagePath);
};

/**
 * Get API URL
 */
export const getAPIURL = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || '/api';
  }
  
  return '/api'; // Proxy in development
};

export default {
  getServerURL,
  getImageURL,
  getAvatarURL,
  getUploadedImageURL,
  getAPIURL
};
