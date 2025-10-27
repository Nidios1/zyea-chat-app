#!/usr/bin/env node

/**
 * Debug script để kiểm tra vấn đề màn hình đen khi build IPA
 * Chạy: node debug-black-screen.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUGGING BLACK SCREEN ISSUE');
console.log('================================');

// 1. Kiểm tra build files
console.log('\n📁 Checking build files...');
const buildDir = path.join(__dirname, 'build');
const publicDir = path.join(__dirname, 'ios', 'App', 'App', 'public');

if (fs.existsSync(buildDir)) {
  console.log('✅ Build directory exists');
  const buildFiles = fs.readdirSync(buildDir);
  console.log('📄 Build files:', buildFiles);
  
  // Kiểm tra index.html
  const indexPath = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    console.log('✅ index.html exists');
    console.log('📏 index.html size:', indexContent.length, 'bytes');
    
    // Kiểm tra có div#root không
    if (indexContent.includes('<div id="root"></div>')) {
      console.log('✅ Found div#root in index.html');
    } else {
      console.log('❌ Missing div#root in index.html');
    }
    
    // Kiểm tra có script tags không
    const scriptMatches = indexContent.match(/<script[^>]*>/g);
    if (scriptMatches) {
      console.log('✅ Found', scriptMatches.length, 'script tags');
    } else {
      console.log('❌ No script tags found');
    }
  } else {
    console.log('❌ index.html not found in build');
  }
} else {
  console.log('❌ Build directory not found');
}

// 2. Kiểm tra iOS public files
console.log('\n📱 Checking iOS public files...');
if (fs.existsSync(publicDir)) {
  console.log('✅ iOS public directory exists');
  const publicFiles = fs.readdirSync(publicDir);
  console.log('📄 iOS public files:', publicFiles);
  
  // Kiểm tra index.html trong iOS
  const iosIndexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(iosIndexPath)) {
    const iosIndexContent = fs.readFileSync(iosIndexPath, 'utf8');
    console.log('✅ iOS index.html exists');
    console.log('📏 iOS index.html size:', iosIndexContent.length, 'bytes');
    
    // So sánh với build version
    const buildIndexPath = path.join(buildDir, 'index.html');
    if (fs.existsSync(buildIndexPath)) {
      const buildIndexContent = fs.readFileSync(buildIndexPath, 'utf8');
      if (iosIndexContent === buildIndexContent) {
        console.log('✅ iOS index.html matches build version');
      } else {
        console.log('⚠️ iOS index.html differs from build version');
      }
    }
  } else {
    console.log('❌ iOS index.html not found');
  }
} else {
  console.log('❌ iOS public directory not found');
}

// 3. Kiểm tra Capacitor config
console.log('\n⚙️ Checking Capacitor configuration...');
const capacitorConfigPath = path.join(__dirname, 'capacitor.config.ts');
const iosCapacitorConfigPath = path.join(__dirname, 'ios', 'App', 'App', 'capacitor.config.json');

if (fs.existsSync(capacitorConfigPath)) {
  console.log('✅ capacitor.config.ts exists');
  const configContent = fs.readFileSync(capacitorConfigPath, 'utf8');
  
  // Kiểm tra splash screen config
  if (configContent.includes('launchShowDuration')) {
    console.log('✅ Splash screen config found');
  } else {
    console.log('❌ Splash screen config missing');
  }
  
  // Kiểm tra webDir
  if (configContent.includes('webDir: \'build\'')) {
    console.log('✅ webDir set to build');
  } else {
    console.log('❌ webDir not set to build');
  }
} else {
  console.log('❌ capacitor.config.ts not found');
}

if (fs.existsSync(iosCapacitorConfigPath)) {
  console.log('✅ iOS capacitor.config.json exists');
  const iosConfigContent = fs.readFileSync(iosCapacitorConfigPath, 'utf8');
  const iosConfig = JSON.parse(iosConfigContent);
  
  console.log('📱 iOS Config:');
  console.log('  - appId:', iosConfig.appId);
  console.log('  - appName:', iosConfig.appName);
  console.log('  - webDir:', iosConfig.webDir);
  console.log('  - splashScreen:', iosConfig.plugins?.SplashScreen);
} else {
  console.log('❌ iOS capacitor.config.json not found');
}

// 4. Kiểm tra MainViewController
console.log('\n🍎 Checking iOS MainViewController...');
const mainViewControllerPath = path.join(__dirname, 'ios', 'App', 'App', 'MainViewController.swift');
if (fs.existsSync(mainViewControllerPath)) {
  console.log('✅ MainViewController.swift exists');
  const controllerContent = fs.readFileSync(mainViewControllerPath, 'utf8');
  
  if (controllerContent.includes('CAPBridgeViewController')) {
    console.log('✅ Extends CAPBridgeViewController');
  } else {
    console.log('❌ Does not extend CAPBridgeViewController');
  }
  
  if (controllerContent.includes('webViewConfiguration')) {
    console.log('✅ Has webViewConfiguration override');
  } else {
    console.log('❌ Missing webViewConfiguration override');
  }
} else {
  console.log('❌ MainViewController.swift not found');
}

// 5. Kiểm tra App.js
console.log('\n⚛️ Checking React App.js...');
const appJsPath = path.join(__dirname, 'src', 'App.js');
if (fs.existsSync(appJsPath)) {
  console.log('✅ App.js exists');
  const appContent = fs.readFileSync(appJsPath, 'utf8');
  
  // Kiểm tra loading state
  if (appContent.includes('const [loading, setLoading] = useState(true)')) {
    console.log('✅ Loading state initialized');
  } else {
    console.log('❌ Loading state not initialized');
  }
  
  // Kiểm tra safety timeout
  if (appContent.includes('safetyTimeout')) {
    console.log('✅ Safety timeout implemented');
  } else {
    console.log('❌ Safety timeout missing');
  }
  
  // Kiểm tra bundle protection
  if (appContent.includes('bundleProtectionFailed')) {
    console.log('✅ Bundle protection check exists');
  } else {
    console.log('❌ Bundle protection check missing');
  }
} else {
  console.log('❌ App.js not found');
}

// 6. Recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('==================');
console.log('1. ✅ Ensure splash screen shows for at least 2 seconds');
console.log('2. ✅ Check that loading state is properly managed');
console.log('3. ✅ Verify WebView loads correctly in MainViewController');
console.log('4. ✅ Test on actual device, not just simulator');
console.log('5. ✅ Check Xcode console for any JavaScript errors');
console.log('6. ✅ Ensure all static assets are properly copied');

console.log('\n🔧 NEXT STEPS:');
console.log('==============');
console.log('1. Build and sync: npm run build:win && npx cap sync ios');
console.log('2. Open in Xcode: npx cap open ios');
console.log('3. Build for device (not simulator)');
console.log('4. Check Xcode console for errors');
console.log('5. Test on physical device');

console.log('\n✨ Debug complete!');

