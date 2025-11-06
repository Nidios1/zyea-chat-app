/**
 * Test script để kiểm tra OTA update configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing OTA Update Configuration...\n');

// 1. Check app.json
console.log('1. Checking app.json...');
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

if (appJson.expo.updates) {
  console.log('   ✅ Updates config found');
  console.log(`   - Enabled: ${appJson.expo.updates.enabled}`);
  console.log(`   - Check automatically: ${appJson.expo.updates.checkAutomatically}`);
  console.log(`   - Update URL: ${appJson.expo.updates.url}`);
} else {
  console.log('   ❌ Updates config missing');
}

if (appJson.expo.runtimeVersion) {
  console.log(`   ✅ Runtime version policy: ${appJson.expo.runtimeVersion.policy}`);
} else {
  console.log('   ❌ Runtime version not configured');
}

// 2. Check eas.json
console.log('\n2. Checking eas.json...');
const easJsonPath = path.join(__dirname, 'eas.json');
const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

if (easJson.update) {
  console.log('   ✅ Update channels configured');
  Object.keys(easJson.update).forEach(channel => {
    console.log(`   - ${channel}: ${easJson.update[channel].channel}`);
  });
} else {
  console.log('   ❌ Update channels not configured');
}

// 3. Check package.json scripts
console.log('\n3. Checking package.json scripts...');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const updateScripts = Object.keys(packageJson.scripts).filter(s => s.includes('update'));
if (updateScripts.length > 0) {
  console.log('   ✅ Update scripts found:');
  updateScripts.forEach(script => {
    console.log(`   - ${script}: ${packageJson.scripts[script]}`);
  });
} else {
  console.log('   ❌ Update scripts not found');
}

// 4. Check dependencies
console.log('\n4. Checking dependencies...');
if (packageJson.dependencies['expo-updates']) {
  console.log(`   ✅ expo-updates installed: ${packageJson.dependencies['expo-updates']}`);
} else {
  console.log('   ❌ expo-updates not found in dependencies');
}

// 5. Check source files
console.log('\n5. Checking source files...');
const filesToCheck = [
  'src/hooks/useUpdates.ts',
  'src/components/Common/UpdateModal.tsx',
  'src/utils/updateUtils.ts',
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
  }
});

// 6. Check publish scripts
console.log('\n6. Checking publish scripts...');
const publishScripts = ['publish-update.js', 'publish-update.bat'];
publishScripts.forEach(script => {
  const scriptPath = path.join(__dirname, script);
  if (fs.existsSync(scriptPath)) {
    console.log(`   ✅ ${script} exists`);
  } else {
    console.log(`   ❌ ${script} missing`);
  }
});

console.log('\n✨ Test completed!\n');
console.log('📝 Next steps:');
console.log('   1. Build production app: npm run eas:build:production');
console.log('   2. Publish update: npm run update:publish "Your message"');
console.log('   3. Test on device with production build');

