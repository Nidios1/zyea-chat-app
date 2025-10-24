/**
 * Script kiểm tra xem app có sẵn sàng build IPA với Live Update không
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying app is ready for IPA build with Live Update...\n');

let allChecks = true;
const warnings = [];

// Check 1: build.zip exists
console.log('📦 Checking build.zip...');
const buildZipPath = path.join(__dirname, 'client/build.zip');
if (fs.existsSync(buildZipPath)) {
  const stats = fs.statSync(buildZipPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`   ✅ build.zip exists (${sizeMB} MB)`);
} else {
  console.log('   ❌ build.zip NOT found!');
  console.log('   Fix: cd client && npm run build && Compress-Archive...');
  allChecks = false;
}

// Check 2: Client version
console.log('\n📱 Checking client version...');
const liveUpdatePath = path.join(__dirname, 'client/src/utils/liveUpdate.js');
if (fs.existsSync(liveUpdatePath)) {
  const content = fs.readFileSync(liveUpdatePath, 'utf8');
  const versionMatch = content.match(/const BASE_VERSION = ['"]([^'"]+)['"]/);
  if (versionMatch) {
    const clientVersion = versionMatch[1];
    console.log(`   ✅ Client BASE_VERSION: ${clientVersion}`);
    
    // Check 3: Server version
    console.log('\n🌐 Checking server version...');
    const serverAppPath = path.join(__dirname, 'server/routes/app.js');
    if (fs.existsSync(serverAppPath)) {
      const serverContent = fs.readFileSync(serverAppPath, 'utf8');
      const serverVersionMatch = serverContent.match(/const APP_VERSION = ['"]([^'"]+)['"]/);
      if (serverVersionMatch) {
        const serverVersion = serverVersionMatch[1];
        console.log(`   ✅ Server APP_VERSION: ${serverVersion}`);
        
        if (clientVersion === serverVersion) {
          console.log(`   ✅ Versions MATCH! (${clientVersion})`);
        } else {
          console.log(`   ⚠️  WARNING: Versions don't match!`);
          console.log(`      Client: ${clientVersion}, Server: ${serverVersion}`);
          warnings.push('Client and Server versions should match for first IPA build');
        }
      }
    }
  }
}

// Check 4: Live Update files exist
console.log('\n📄 Checking Live Update files...');
const requiredFiles = [
  'client/src/utils/liveUpdate.js',
  'client/src/App.js',
  'client/public/sw.js',
  'server/routes/app.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NOT found!`);
    allChecks = false;
  }
});

// Check 5: API URL check
console.log('\n🔗 Checking API URL configuration...');
const liveUpdateContent = fs.readFileSync(liveUpdatePath, 'utf8');
const apiUrlMatch = liveUpdateContent.match(/fetch\(['"]([^'"]+)['"]\)/);
if (apiUrlMatch) {
  const apiUrl = apiUrlMatch[1];
  console.log(`   Current API URL: ${apiUrl}`);
  if (apiUrl.includes('localhost') || apiUrl.includes('192.168')) {
    console.log(`   ⚠️  WARNING: Using local IP/localhost`);
    warnings.push('Update API URL for production deployment');
  } else {
    console.log(`   ✅ Using production URL`);
  }
}

// Check 6: Update interval
console.log('\n⏱️  Checking update interval...');
const intervalMatch = liveUpdateContent.match(/const UPDATE_CHECK_INTERVAL = (\d+)/);
if (intervalMatch) {
  const interval = parseInt(intervalMatch[1]);
  const seconds = interval / 1000;
  console.log(`   Current interval: ${seconds}s`);
  if (interval < 60000) {
    console.log(`   ⚠️  WARNING: Very short interval (${seconds}s)`);
    warnings.push('Consider increasing UPDATE_CHECK_INTERVAL to 5 minutes (300000) for production');
  } else {
    console.log(`   ✅ Reasonable interval`);
  }
}

// Check 7: Build folder exists
console.log('\n📂 Checking build folder...');
const buildFolderPath = path.join(__dirname, 'client/build');
if (fs.existsSync(buildFolderPath)) {
  console.log(`   ✅ Build folder exists`);
} else {
  console.log(`   ❌ Build folder NOT found!`);
  console.log(`   Fix: cd client && npm run build`);
  allChecks = false;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 SUMMARY\n');

if (allChecks && warnings.length === 0) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log('\n✅ Your app is READY to build IPA with Live Update!');
  console.log('\n🚀 Next steps:');
  console.log('   1. cd client');
  console.log('   2. npx cap sync ios');
  console.log('   3. npx cap open ios');
  console.log('   4. Product → Archive → Distribute');
} else if (allChecks && warnings.length > 0) {
  console.log('⚠️  READY with WARNINGS');
  console.log('\n✅ Core checks passed, but consider these warnings:\n');
  warnings.forEach((warning, index) => {
    console.log(`   ${index + 1}. ${warning}`);
  });
  console.log('\n💡 You can build IPA now, but address warnings for production.');
} else {
  console.log('❌ NOT READY - Fix errors above first!');
}

console.log('\n' + '='.repeat(60));
console.log('\n📖 Read full guide: BUILD-IPA-WITH-LIVE-UPDATE.md');
console.log('📋 Quick reference: QUICK-BUILD-CHECKLIST.md\n');

