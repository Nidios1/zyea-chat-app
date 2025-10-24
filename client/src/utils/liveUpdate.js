/**
 * Live Update System for Capacitor App
 * Cho phép update code React mà không cần build lại IPA
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Version hiện tại của app (tăng mỗi khi có update)
const BASE_VERSION = '0.9.0'; // Giảm xuống để test popup (server có v1.0.0)
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
    // Chỉ check update cho native app (mobile)
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

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
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Updates only available on native platforms');
    }

    // Download update bundle
    const response = await fetch(updateUrl);
    const blob = await response.blob();
    
    // Đọc file as base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          // Save to device (chỉ cho native app)
          if (Capacitor.isNativePlatform()) {
            await Filesystem.writeFile({
              path: 'updates/bundle.zip',
              data: base64Data,
              directory: Directory.Data
            });
          }
          
          // Cho PWA, chỉ cần download thành công là đủ để test
          console.log('✅ Update downloaded successfully!');
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
    });
  } catch (error) {
    console.error('Error downloading update:', error);
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

