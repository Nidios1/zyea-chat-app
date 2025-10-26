/**
 * Bundle ID Protection System
 * Bảo vệ Bundle ID không bị thay đổi hoặc crack
 * Copyright © 2024 Zyea - All Rights Reserved
 */

import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Mã hóa Bundle ID chính thức (obfuscated)
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev';

// Checksum của Bundle ID để verify (SHA-256 simplified)
const BUNDLE_CHECKSUM = generateChecksum(PROTECTED_BUNDLE_ID);

// Mảng các checksum backup (obfuscated multiple times)
const BACKUP_CHECKSUMS = [
  '7a8f3e2d1c9b4a5e6f0d8c7b9a1e2f3d', // Fake checksum 1
  generateChecksum(PROTECTED_BUNDLE_ID), // Real checksum (hidden)
  '9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f', // Fake checksum 2
];

// Flags để track validation
let isValidated = false;
let validationAttempts = 0;
const MAX_VALIDATION_ATTEMPTS = 3;

/**
 * Generate simple checksum for string
 */
function generateChecksum(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Obfuscate string để khó đọc trong source
 */
function obfuscate(str) {
  return btoa(str).split('').reverse().join('');
}

/**
 * Deobfuscate string
 */
function deobfuscate(str) {
  try {
    return atob(str.split('').reverse().join(''));
  } catch (e) {
    return null;
  }
}

/**
 * Kiểm tra Bundle ID có hợp lệ không
 */
async function validateBundleId() {
  // Nếu đã validate rồi, return true
  if (isValidated) {
    return true;
  }

  // Increment validation attempts
  validationAttempts++;
  
  // Nếu vượt quá số lần thử, block app
  if (validationAttempts > MAX_VALIDATION_ATTEMPTS) {
    console.error('[Security] Too many validation attempts');
    return false;
  }

  try {
    // Chỉ validate trên native app (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      isValidated = true;
      return true;
    }

    // Lấy thông tin app
    const appInfo = await CapacitorApp.getInfo();
    const currentBundleId = appInfo.id;

    // Debug logging
    console.log('[Security] Current Bundle ID:', currentBundleId);
    console.log('[Security] Expected Bundle ID:', PROTECTED_BUNDLE_ID);
    console.log('[Security] Bundle ID Match:', currentBundleId === PROTECTED_BUNDLE_ID);

    // Validate Bundle ID
    if (currentBundleId !== PROTECTED_BUNDLE_ID) {
      console.error('[Security] ❌ Invalid Bundle ID detected');
      console.error('[Security] Expected:', PROTECTED_BUNDLE_ID);
      console.error('[Security] Got:', currentBundleId);
      console.error('[Security] This will trigger Bundle Protection Error Screen');
      return false;
    }

    // Validate checksum
    const currentChecksum = generateChecksum(currentBundleId);
    if (currentChecksum !== BUNDLE_CHECKSUM) {
      console.error('[Security] Bundle ID checksum mismatch');
      return false;
    }

    // Verify với backup checksums
    const isChecksumValid = BACKUP_CHECKSUMS.some(cs => cs === currentChecksum);
    if (!isChecksumValid) {
      console.error('[Security] Bundle ID validation failed');
      return false;
    }

    // All checks passed
    isValidated = true;
    console.log('[Security] Bundle ID validated successfully');
    return true;

  } catch (error) {
    console.error('[Security] Bundle ID validation error:', error);
    return false;
  }
}

/**
 * Validate Bundle ID và block app nếu không hợp lệ
 */
export async function initBundleProtection() {
  const isValid = await validateBundleId();
  
  if (!isValid) {
    // Block app bằng cách return false
    console.error('[Security] ⚠️ BUNDLE ID PROTECTION TRIGGERED');
    console.error('[Security] This app is protected and cannot run with modified Bundle ID');
    console.error('[Security] Official Bundle ID: com.zyea.hieudev');
    
    // Force show error screen by throwing error
    throw new Error('BUNDLE_ID_PROTECTION_FAILED');
  }

  return true;
}

/**
 * Continuous validation trong runtime
 */
export function startContinuousValidation() {
  // Validate mỗi 30 giây
  setInterval(async () => {
    const isValid = await validateBundleId();
    if (!isValid) {
      // Force reload hoặc show error
      window.location.href = 'about:blank';
    }
  }, 30000);
}

/**
 * Get protected Bundle ID (obfuscated)
 */
export function getProtectedBundleId() {
  return PROTECTED_BUNDLE_ID;
}

/**
 * Check if app is running with valid Bundle ID
 */
export function isValidBundleId() {
  return isValidated;
}

/**
 * Kiểm tra xem có phải app chính thức không
 */
export async function isOfficialApp() {
  if (!Capacitor.isNativePlatform()) {
    return true; // Web version always valid
  }

  try {
    const appInfo = await CapacitorApp.getInfo();
    return appInfo.id === PROTECTED_BUNDLE_ID;
  } catch (error) {
    return false;
  }
}

// Anti-tampering: Tự động kiểm tra khi module được load
(async () => {
  if (Capacitor.isNativePlatform()) {
    await validateBundleId();
  }
})();

/**
 * Test function để trigger Bundle Protection (for debugging)
 * Note: This function should be called from App.js, not from this module
 */
export function testBundleProtection() {
  console.log('[Security] 🧪 Testing Bundle Protection...');
  console.log('[Security] Call setBundleProtectionFailed(true) from App.js to trigger error screen');
}

/**
 * Reset Bundle Protection (for debugging)
 */
export function resetBundleProtection() {
  console.log('[Security] 🔄 Resetting Bundle Protection...');
  isValidated = false;
  validationAttempts = 0;
}

export default {
  initBundleProtection,
  startContinuousValidation,
  getProtectedBundleId,
  isValidBundleId,
  isOfficialApp,
  testBundleProtection,
  resetBundleProtection
};

