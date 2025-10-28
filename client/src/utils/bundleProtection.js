/**
 * Bundle ID Protection System (Disabled for web)
 * Bảo vệ Bundle ID không bị thay đổi hoặc crack
 * Copyright © 2024 Zyea - All Rights Reserved
 */

// Mã hóa Bundle ID chính thức (obfuscated)
const PROTECTED_BUNDLE_ID = 'com.zyea.hieudev';

// Checksum của Bundle ID để verify (SHA-256 simplified)
const BUNDLE_CHECKSUM = generateChecksum(PROTECTED_BUNDLE_ID);

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
  return Math.abs(hash).toString(16);
}

/**
 * Validate Bundle ID
 * Only works on native platforms
 */
export async function initBundleProtection() {
  // Web version always returns true (no protection needed)
  return true;
}

/**
 * Validate Bundle ID
 */
export async function validateBundleId() {
  // Web version always returns true
  return true;
}

/**
 * Check if this is the official app (web always true)
 */
export async function isOfficialApp() {
  // Web version always valid
  return true;
}

export default {
  initBundleProtection,
  validateBundleId,
  isOfficialApp
};
