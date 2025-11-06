#!/usr/bin/env node

/**
 * Script để publish OTA updates cho Expo
 * 
 * Usage:
 *   node publish-update.js [branch] [message]
 * 
 * Examples:
 *   node publish-update.js production "Fix bug login"
 *   node publish-update.js preview "Test new feature"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Đọc app.json để lấy version
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// Lấy arguments
const branch = process.argv[2] || 'production';
const message = process.argv[3] || `Update version ${appJson.expo.version}`;

// Validate branch
const validBranches = ['production', 'preview'];
if (!validBranches.includes(branch)) {
  console.error(`❌ Invalid branch: ${branch}`);
  console.error(`   Valid branches: ${validBranches.join(', ')}`);
  process.exit(1);
}

console.log('🚀 Publishing OTA Update...');
console.log(`   Branch: ${branch}`);
console.log(`   Message: ${message}`);
console.log(`   Version: ${appJson.expo.version}`);
console.log('');

try {
  // Publish update
  const command = `eas update --branch ${branch} --message "${message}"`;
  console.log(`📤 Running: ${command}`);
  console.log('');

  execSync(command, {
    stdio: 'inherit',
    cwd: __dirname,
  });

  console.log('');
  console.log('✅ Update published successfully!');
  console.log('');
  console.log('📱 Users will receive the update:');
  console.log('   - Automatically on next app launch');
  console.log('   - Or when app comes to foreground (if checkInterval is set)');
  console.log('');
} catch (error) {
  console.error('');
  console.error('❌ Failed to publish update');
  console.error('');
  process.exit(1);
}

