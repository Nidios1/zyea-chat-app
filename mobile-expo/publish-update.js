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
 * 
 * Environment Variables:
 *   EXPO_TOKEN - Expo access token (không cần email khi chạy)
 *                Lấy từ: https://expo.dev/accounts/[username]/settings/access-tokens
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Đọc file .env nếu tồn tại (hỗ trợ EXPO_TOKEN từ .env)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  });
}

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

// Kiểm tra EXPO_TOKEN (không bắt buộc - có thể dùng session)
const expoToken = process.env.EXPO_TOKEN;
const useToken = !!expoToken;

console.log('🚀 Publishing OTA Update...');
console.log(`   Branch: ${branch}`);
console.log(`   Message: ${message}`);
console.log(`   Version: ${appJson.expo.version}`);

if (useToken) {
  console.log(`   🔑 Using EXPO_TOKEN: ${expoToken.substring(0, 10)}...`);
  console.log('   💡 Token mode: Không cần email khi chạy');
} else {
  console.log('   🔑 Using EAS session (đã login)');
  console.log('   💡 Nếu chưa login, chạy: eas login');
  console.log('   💡 Hoặc set EXPO_TOKEN trong file .env để không cần login');
}

console.log('');

try {
  // Publish update với --non-interactive để không hỏi email
  const command = `eas update --branch ${branch} --message "${message}" --non-interactive`;
  console.log(`📤 Running: ${command}`);
  console.log('');

  // Set EXPO_TOKEN trong environment nếu có
  const env = { ...process.env };
  if (useToken) {
    env.EXPO_TOKEN = expoToken;
  }

  execSync(command, {
    stdio: 'inherit',
    cwd: __dirname,
    env: env,
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
  console.error('💡 Kiểm tra:');
  if (useToken) {
    console.error('   - EXPO_TOKEN có đúng không?');
    console.error('   - Token có quyền truy cập project không?');
  } else {
    console.error('   - Bạn đã login EAS chưa? Chạy: eas login');
    console.error('   - Hoặc set EXPO_TOKEN trong file .env');
  }
  console.error('   - Project ID trong app.json có đúng không?');
  console.error('   - Bạn có quyền truy cập project này không?');
  console.error('');
  process.exit(1);
}

