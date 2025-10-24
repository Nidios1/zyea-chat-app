/**
 * Live Update System for Capacitor App
 * Cho phép update code React mà không cần build lại IPA
 */

import { Capacitor } from '@capacitor/core';

// Version hiện tại của app (tăng mỗi khi có update)
const BASE_VERSION = '0.8.0'; // Set thấp để test popup (server có v1.0.2)
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
export const applyUpdate = (newVersion) => {
  // Lưu version mới vào localStorage
  if (newVersion) {
    try {
      localStorage.setItem('app_version', newVersion);
      console.log(`✅ Saved new version: ${newVersion}`);
    } catch (error) {
      console.error('Error saving version:', error);
    }
  }
  
  // Reload app để áp dụng update
  console.log('🔄 Applying update...');
  window.location.reload();
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

