/**
 * Image URL utilities for handling both web and native app
 */

import { Capacitor } from '@capacitor/core';

/**
 * Get server URL based on environment
 */
export const getServerURL = () => {
  // For Capacitor native apps, always use full server URL
  if (Capacitor.isNativePlatform()) {
    return process.env.REACT_APP_SERVER_URL || 'http://192.168.0.103:5000';
  }
  
  // For web, can use relative URLs (handled by proxy) or full URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_SERVER_URL || '';
  }
  
  // Development - use proxy
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
  
  // For Capacitor native apps, prepend server URL
  if (Capacitor.isNativePlatform()) {
    const serverURL = getServerURL();
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${serverURL}${cleanPath}`;
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
  if (Capacitor.isNativePlatform()) {
    return process.env.REACT_APP_API_URL || 'http://192.168.0.103:5000/api';
  }
  
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

