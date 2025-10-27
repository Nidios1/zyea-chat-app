#!/usr/bin/env node

/**
 * Script để build và sync iOS app với các cải tiến cho vấn đề màn hình đen
 * Chạy: node build-ios-fixed.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BUILDING iOS APP WITH BLACK SCREEN FIXES');
console.log('===========================================');

try {
  // 1. Clean build
  console.log('\n🧹 Cleaning previous build...');
  if (fs.existsSync('build')) {
    execSync('rmdir /s /q build', { stdio: 'inherit' });
  }
  
  // 2. Build React app
  console.log('\n⚛️ Building React app...');
  execSync('npm run build:win', { stdio: 'inherit' });
  
  // 3. Verify build
  console.log('\n✅ Verifying build...');
  const indexPath = path.join('build', 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Build failed - index.html not found');
  }
  
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  if (!indexContent.includes('<div id="root"></div>')) {
    throw new Error('Build failed - root div not found');
  }
  
  console.log('✅ Build verification passed');
  
  // 4. Sync with Capacitor
  console.log('\n📱 Syncing with Capacitor...');
  execSync('npx cap sync ios', { stdio: 'inherit' });
  
  // 5. Verify iOS files
  console.log('\n✅ Verifying iOS files...');
  const iosIndexPath = path.join('ios', 'App', 'App', 'public', 'index.html');
  if (!fs.existsSync(iosIndexPath)) {
    throw new Error('iOS sync failed - index.html not found');
  }
  
  console.log('✅ iOS sync verification passed');
  
  // 6. Additional iOS optimizations
  console.log('\n🔧 Applying iOS optimizations...');
  
  // Ensure proper Info.plist configuration
  const infoPlistPath = path.join('ios', 'App', 'App', 'Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    let infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
    
    // Add debugging capabilities for development
    if (!infoPlistContent.includes('webContentsDebuggingEnabled')) {
      console.log('📝 Adding webContentsDebuggingEnabled to Info.plist');
      infoPlistContent = infoPlistContent.replace(
        '</dict>',
        '	<key>webContentsDebuggingEnabled</key>\n	<true/>\n</dict>'
      );
      fs.writeFileSync(infoPlistPath, infoPlistContent);
    }
  }
  
  console.log('\n🎉 BUILD COMPLETED SUCCESSFULLY!');
  console.log('================================');
  console.log('✅ React app built');
  console.log('✅ Capacitor synced');
  console.log('✅ iOS optimizations applied');
  console.log('✅ All files verified');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('==============');
  console.log('1. Open Xcode: npx cap open ios');
  console.log('2. Select your device (not simulator)');
  console.log('3. Build and run (⌘+R)');
  console.log('4. Check Xcode console for any errors');
  console.log('5. If still black screen, check:');
  console.log('   - Network connectivity');
  console.log('   - API server is running');
  console.log('   - JavaScript console errors');
  
  console.log('\n🔍 DEBUGGING TIPS:');
  console.log('==================');
  console.log('- Check Xcode console for JavaScript errors');
  console.log('- Verify network requests in Safari Web Inspector');
  console.log('- Test on physical device, not simulator');
  console.log('- Ensure API server is accessible from device');
  
} catch (error) {
  console.error('\n❌ BUILD FAILED:', error.message);
  console.log('\n🔧 TROUBLESHOOTING:');
  console.log('===================');
  console.log('1. Check if all dependencies are installed: npm install');
  console.log('2. Clear node_modules and reinstall if needed');
  console.log('3. Check for any TypeScript/JavaScript errors');
  console.log('4. Ensure Capacitor CLI is installed: npm install -g @capacitor/cli');
  process.exit(1);
}

