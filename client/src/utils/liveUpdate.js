/**
 * Live Update System for Capacitor App
 * Cho phép update code React mà không cần build lại IPA
 */

import { Capacitor } from '@capacitor/core';

// Version hiện tại của app (tăng mỗi khi có update)
const BASE_VERSION = '1.1.6'; // Force update - version badge removed
const UPDATE_CHECK_INTERVAL = 30000; // Check mỗi 30s

// Lấy version từ localStorage (nếu đã update) hoặc dùng BASE_VERSION
const getStoredVersion = () => {
  try {
    return localStorage.getItem('app_version') || BASE_VERSION;
  } catch {
    return BASE_VERSION;
  }
};

const CURRENT_VERSION = getStoredVersion();

/**
 * Check xem có version mới không
 */
export const checkForUpdates = async () => {
  try {
    // Live Update hoạt động cả PWA và Native App
    const response = await fetch('http://192.168.0.102:5000/api/app/version');
    const data = await response.json();
    
    const { version, updateUrl, changeLog, mandatory } = data;
    
    // So sánh version
    if (version !== CURRENT_VERSION) {
      return {
        hasUpdate: true,
        version,
        updateUrl,
        changeLog,
        mandatory,
        currentVersion: CURRENT_VERSION
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return null;
  }
};

/**
 * Download và apply update
 */
export const downloadUpdate = async (updateUrl, onProgress) => {
  try {
    console.log('📥 Downloading update from:', updateUrl);
    
    // Download update bundle (hoạt động cả PWA và Native)
    const response = await fetch(updateUrl);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('✅ Download completed, size:', blob.size, 'bytes');
    
    // Không cần save file, chỉ cần verify download thành công
    // Version sẽ được lưu vào localStorage trong applyUpdate()
    
    return true;
  } catch (error) {
    console.error('❌ Error downloading update:', error);
    throw error;
  }
};

/**
 * Apply update (reload app với bundle mới)
 */
export const applyUpdate = async (newVersion) => {
  // Lưu version mới vào localStorage
  if (newVersion) {
    try {
      localStorage.setItem('app_version', newVersion);
      console.log(`✅ Saved new version: ${newVersion}`);
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }
  
  // Clear Service Worker cache để force reload resources mới
  if ('serviceWorker' in navigator && 'caches' in window) {
    try {
      console.log('🗑️ Clearing Service Worker caches...');
      
      // Get all cache names
      const cacheNames = await caches.keys();
      console.log('Found caches:', cacheNames);
      
      // Delete all caches
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      console.log('✅ All caches cleared');
      
      // Unregister service worker để force reinstall
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Service Worker unregistered');
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }
  
  // Hard reload app để áp dụng update (bypass cache)
  console.log('🔄 Applying update...');
  window.location.reload(true); // true = hard reload, bypass cache
};

/**
 * Auto check for updates
 */
export const startAutoUpdateCheck = (onUpdateAvailable) => {
  const checkInterval = setInterval(async () => {
    const update = await checkForUpdates();
    if (update && update.hasUpdate) {
      onUpdateAvailable(update);
    }
  }, UPDATE_CHECK_INTERVAL);
  
  return () => clearInterval(checkInterval);
};

/**
 * Get current version
 */
export const getCurrentVersion = () => CURRENT_VERSION;

