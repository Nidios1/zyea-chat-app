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

/**
 * Get Sticker URL from database path
 * @param {string} stickerPath - Sticker path from database
 * @returns {string} Full sticker URL
 */
export const getStickerURL = (stickerPath) => {
  if (!stickerPath) {
    return '';
  }

  // If already a full URL
  if (stickerPath.startsWith('http://') || stickerPath.startsWith('https://')) {
    return stickerPath;
  }

  // Get base URL from API URL
  const apiUrl = getAPIURL();
  const baseUrl = apiUrl.replace('/api', '');
  
  // Normalize path
  let normalizedPath = stickerPath.trim();
  
  // Remove leading slash if present (we'll add it)
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.substring(1);
  }
  
  // Construct full URL
  return `${baseUrl}/${normalizedPath}`;
};

export default {
  getServerURL,
  getImageURL,
  getAvatarURL,
  getUploadedImageURL,
  getAPIURL,
  getStickerURL
};
