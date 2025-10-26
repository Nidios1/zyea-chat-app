#!/usr/bin/env node

/**
 * Script kiểm tra xem dự án đã sẵn sàng build iOS IPA chưa
 * Chạy: node verify-ios-build-ready.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 KIỂM TRA DỰ ÁN SẴN SÀNG BUILD iOS IPA...\n');
console.log('='.repeat(60));

let totalChecks = 0;
let passedChecks = 0;
let warnings = [];

// Helper function
function check(name, condition, errorMsg = '', isWarning = false) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ ${name}`);
    return true;
  } else {
    if (isWarning) {
      warnings.push(`⚠️  ${name}: ${errorMsg}`);
      console.log(`⚠️  ${name}: ${errorMsg}`);
      passedChecks++; // Count as pass but show warning
    } else {
      console.log(`❌ ${name}: ${errorMsg}`);
    }
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function countFiles(dirPath, pattern) {
  if (!fs.existsSync(path.join(__dirname, dirPath))) return 0;
  const files = fs.readdirSync(path.join(__dirname, dirPath));
  return files.filter(f => f.match(pattern)).length;
}

console.log('\n📦 1. CẤU TRÚC DỰ ÁN');
console.log('-'.repeat(60));
check('client/ directory', fileExists('client'));
check('server/ directory', fileExists('server'));
check('client/src/ directory', fileExists('client/src'));
check('client/ios/ directory', fileExists('client/ios'));

console.log('\n📱 2. iOS PROJECT FILES');
console.log('-'.repeat(60));
check('capacitor.config.ts', fileExists('client/capacitor.config.ts'));
check('Info.plist', fileExists('client/ios/App/App/Info.plist'));
check('App.xcworkspace', fileExists('client/ios/App/App.xcworkspace'));
check('Podfile', fileExists('client/ios/App/Podfile'));

console.log('\n🎨 3. APP ICONS & ASSETS');
console.log('-'.repeat(60));
const iconCount = countFiles('client/ios/App/App/Assets.xcassets/AppIcon.appiconset', /\.png$/);
check(`App Icons (${iconCount} files)`, iconCount >= 15, `Cần ít nhất 15 icon, hiện có ${iconCount}`);
check('AppIcon Contents.json', fileExists('client/ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json'));
check('Splash screens', fileExists('client/ios/App/App/Assets.xcassets/Splash.imageset'));
check('resources/icon.png', fileExists('client/resources/icon.png'));
check('resources/splash.png', fileExists('client/resources/splash.png'));

console.log('\n🔧 4. DEPENDENCIES');
console.log('-'.repeat(60));
check('client/package.json', fileExists('client/package.json'));
check('client/node_modules/', fileExists('client/node_modules'));
check('server/package.json', fileExists('server/package.json'));
check('server/node_modules/', fileExists('server/node_modules'));

// Check key dependencies
if (fileExists('client/package.json')) {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'client/package.json'), 'utf8'));
  check('React installed', !!pkg.dependencies.react);
  check('Capacitor core', !!pkg.dependencies['@capacitor/core']);
  check('Capacitor iOS', !!pkg.dependencies['@capacitor/ios']);
  check('Socket.IO client', !!pkg.dependencies['socket.io-client']);
}

console.log('\n⚙️ 5. GITHUB ACTIONS WORKFLOW');
console.log('-'.repeat(60));
check('GitHub Actions folder', fileExists('.github/workflows'));
check('build-unsigned-ipa.yml', fileExists('.github/workflows/build-unsigned-ipa.yml'));

if (fileExists('.github/workflows/build-unsigned-ipa.yml')) {
  const workflow = fs.readFileSync(path.join(__dirname, '.github/workflows/build-unsigned-ipa.yml'), 'utf8');
  check('Workflow has iOS build steps', workflow.includes('xcodebuild'));
  check('Workflow creates IPA', workflow.includes('.ipa'));
  check('Workflow uploads artifact', workflow.includes('upload-artifact'));
}

console.log('\n🔐 6. iOS CONFIGURATION');
console.log('-'.repeat(60));
if (fileExists('client/capacitor.config.ts')) {
  const config = fs.readFileSync(path.join(__dirname, 'client/capacitor.config.ts'), 'utf8');
  check('App ID configured', config.includes('appId:'));
  check('App Name configured', config.includes('appName:'));
  check('iOS config present', config.includes('ios:'));
  check('Capacitor plugins configured', config.includes('plugins:'));
}

if (fileExists('client/ios/App/App/Info.plist')) {
  const plist = fs.readFileSync(path.join(__dirname, 'client/ios/App/App/Info.plist'), 'utf8');
  check('Camera permission', plist.includes('NSCameraUsageDescription'));
  check('Microphone permission', plist.includes('NSMicrophoneUsageDescription'));
  check('Photo Library permission', plist.includes('NSPhotoLibraryUsageDescription'));
  check('Bundle Display Name', plist.includes('CFBundleDisplayName'));
}

console.log('\n🌐 7. BACKEND SERVER');
console.log('-'.repeat(60));
check('server/index.js', fileExists('server/index.js'));
check('server/routes/', fileExists('server/routes'));
check('server/config/', fileExists('server/config'));
const routeCount = fileExists('server/routes') ? 
  fs.readdirSync(path.join(__dirname, 'server/routes')).length : 0;
check(`API Routes (${routeCount} files)`, routeCount > 0, 'Không tìm thấy route files');

console.log('\n🏗️ 8. BUILD FILES');
console.log('-'.repeat(60));
const hasBuild = fileExists('client/build');
check('client/build/ directory', hasBuild, 'Chưa build React app', true);

console.log('\n📚 9. DOCUMENTATION');
console.log('-'.repeat(60));
check('README.md', fileExists('README.md'), '', true);
check('IOS-BUILD-READINESS-REPORT.md', fileExists('IOS-BUILD-READINESS-REPORT.md'), '', true);
check('IOS-BUILD-CHECKLIST.md', fileExists('IOS-BUILD-CHECKLIST.md'), '', true);

console.log('\n' + '='.repeat(60));
console.log('\n📊 KẾT QUẢ KIỂM TRA\n');

const percentage = Math.round((passedChecks / totalChecks) * 100);
const status = percentage >= 95 ? '✅ SẴN SÀNG' : percentage >= 80 ? '⚠️ GẦN XONG' : '❌ CHƯA SẴN SÀNG';

console.log(`Tổng số kiểm tra: ${totalChecks}`);
console.log(`Đã hoàn thành: ${passedChecks}/${totalChecks}`);
console.log(`Tiến độ: ${percentage}%`);
console.log(`Trạng thái: ${status}\n`);

if (warnings.length > 0) {
  console.log('⚠️  CẢNH BÁO:');
  warnings.forEach(w => console.log(`   ${w}`));
  console.log('');
}

if (percentage >= 95) {
  console.log('🎉 CHÚC MỪNG! Dự án đã sẵn sàng build iOS IPA!\n');
  console.log('📋 BƯỚC TIẾP THEO:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "feat: Ready for iOS production build"');
  console.log('   3. git push origin main');
  console.log('   4. Đợi GitHub Actions build IPA (~15-20 phút)');
  console.log('   5. Download IPA từ GitHub Actions > Artifacts');
  console.log('   6. Ký IPA với ESign/AltStore/Sideloadly');
  console.log('   7. Cài đặt lên iPhone và test!\n');
  console.log('📖 Chi tiết: Xem IOS-BUILD-CHECKLIST.md\n');
} else if (percentage >= 80) {
  console.log('⚠️  Dự án gần hoàn thành nhưng cần sửa một số vấn đề.\n');
  console.log('📖 Xem chi tiết lỗi ở trên và fix trước khi build.\n');
} else {
  console.log('❌ Dự án chưa sẵn sàng. Cần hoàn thành thêm nhiều bước.\n');
  console.log('📖 Xem IOS-BUILD-READINESS-REPORT.md để biết chi tiết.\n');
}

process.exit(percentage >= 95 ? 0 : 1);

