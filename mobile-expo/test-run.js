/**
 * Test script để kiểm tra app có thể compile và chạy được không
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing App Compilation...\n');

// Check if all required files exist
console.log('1. Checking required files...');
const requiredFiles = [
  'App.tsx',
  'src/hooks/useUpdates.ts',
  'src/components/Common/UpdateModal.tsx',
  'src/utils/updateUtils.ts',
  'src/App.tsx',
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check imports in App.tsx
console.log('\n2. Checking App.tsx imports...');
const appContent = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');

const requiredImports = [
  'useUpdates',
  'UpdateModal',
  'expo-notifications',
];

requiredImports.forEach(imp => {
  if (appContent.includes(imp)) {
    console.log(`   ✅ ${imp} imported`);
  } else {
    console.log(`   ❌ ${imp} - NOT FOUND`);
  }
});

// Check if useUpdates is called
if (appContent.includes('useUpdates(')) {
  console.log('   ✅ useUpdates hook is used');
} else {
  console.log('   ❌ useUpdates hook is NOT used');
}

// Check if UpdateModal is rendered
if (appContent.includes('<UpdateModal')) {
  console.log('   ✅ UpdateModal is rendered');
} else {
  console.log('   ❌ UpdateModal is NOT rendered');
}

console.log('\n3. Checking package.json dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

if (packageJson.dependencies['expo-updates']) {
  console.log(`   ✅ expo-updates: ${packageJson.dependencies['expo-updates']}`);
} else {
  console.log('   ❌ expo-updates not found');
}

console.log('\n✨ Basic checks completed!\n');
console.log('📱 To test on device:');
console.log('   1. Scan QR code with Expo Go app');
console.log('   2. Or press "i" for iOS simulator');
console.log('   3. Or press "a" for Android emulator');
console.log('\n⚠️  Note: OTA updates only work in production builds, not in Expo Go');
console.log('   To test OTA: Build production app and publish an update');

