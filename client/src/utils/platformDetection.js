/**
 * Platform Detection Utilities
 * Detect if app is running as Capacitor native app or PWA
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if running in Capacitor native app
 */
export const isCapacitor = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running in web browser (PWA)
 */
export const isWeb = () => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Check if running as installed PWA (Add to Home Screen)
 */
export const isInstalledPWA = () => {
  // Check if running in standalone mode (iOS)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check if running in fullscreen (Android)
  const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
  
  // Check if running in minimal-ui
  const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
  
  // Check navigator.standalone (iOS Safari)
  const isiOSStandalone = window.navigator.standalone === true;
  
  return isStandalone || isFullscreen || isMinimalUI || isiOSStandalone;
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
};

/**
 * Get platform name
 */
export const getPlatformName = () => {
  if (isCapacitor()) {
    return `Capacitor ${Capacitor.getPlatform()}`;
  }
  if (isInstalledPWA()) {
    return 'PWA (Installed)';
  }
  return 'Web Browser';
};

/**
 * Log platform info (for debugging)
 */
export const logPlatformInfo = () => {
  console.log('🔍 Platform Detection:');
  console.log('  - isCapacitor:', isCapacitor());
  console.log('  - Platform:', Capacitor.getPlatform());
  console.log('  - isIOS:', isIOS());
  console.log('  - isAndroid:', isAndroid());
  console.log('  - isWeb:', isWeb());
  console.log('  - isInstalledPWA:', isInstalledPWA());
  console.log('  - isMobileDevice:', isMobileDevice());
  console.log('  - Platform Name:', getPlatformName());
};

export default {
  isCapacitor,
  isIOS,
  isAndroid,
  isWeb,
  isInstalledPWA,
  isMobileDevice,
  getPlatformName,
  logPlatformInfo
};

