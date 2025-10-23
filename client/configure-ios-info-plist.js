#!/usr/bin/env node

/**
 * Configure iOS Info.plist for Full Screen with Notch Support
 * Run after: npx cap add ios
 * Auto-run with: npm run ios:config
 */

const fs = require('fs');
const path = require('path');

const PLIST_PATH = path.join(__dirname, 'ios', 'App', 'App', 'Info.plist');

console.log('🔧 Configuring iOS Info.plist for fullscreen with notch support...');

// Check if iOS folder exists
if (!fs.existsSync(path.join(__dirname, 'ios'))) {
  console.error('❌ iOS folder not found! Please run: npx cap add ios');
  process.exit(1);
}

// Check if Info.plist exists
if (!fs.existsSync(PLIST_PATH)) {
  console.error('❌ Info.plist not found at:', PLIST_PATH);
  console.error('   Make sure you have run: npx cap add ios');
  process.exit(1);
}

// Read Info.plist
let plistContent = fs.readFileSync(PLIST_PATH, 'utf8');

console.log('📄 Reading Info.plist...');

// Configuration to add
const configs = [
  {
    key: 'UIViewControllerBasedStatusBarAppearance',
    value: 'true',
    type: 'boolean',
    description: 'Allow app to control status bar per view controller'
  },
  {
    key: 'UIStatusBarHidden',
    value: 'false',
    type: 'boolean',
    description: 'Show status bar (required for notch display)'
  },
  {
    key: 'UIStatusBarStyle',
    value: 'UIStatusBarStyleLightContent',
    type: 'string',
    description: 'Light status bar style (white text)'
  },
  {
    key: 'UIRequiresFullScreen',
    value: 'false',
    type: 'boolean',
    description: 'Allow all orientations and fullscreen'
  },
  {
    key: 'UILaunchStoryboardName',
    value: 'LaunchScreen',
    type: 'string',
    description: 'Launch screen for splash'
  }
];

let modified = false;

configs.forEach(config => {
  const { key, value, type, description } = config;
  
  // Check if key already exists
  const keyExists = plistContent.includes(`<key>${key}</key>`);
  
  if (keyExists) {
    console.log(`✅ ${key} already exists - skipping`);
  } else {
    console.log(`➕ Adding ${key} = ${value}`);
    
    // Find the closing </dict> tag before </plist>
    const dictCloseIndex = plistContent.lastIndexOf('</dict>');
    
    if (dictCloseIndex === -1) {
      console.error('❌ Could not find </dict> tag in Info.plist');
      return;
    }
    
    // Prepare the XML entry
    let entry = '';
    if (type === 'boolean') {
      entry = `\t<key>${key}</key>\n\t<${value}/>\n`;
    } else if (type === 'string') {
      entry = `\t<key>${key}</key>\n\t<string>${value}</string>\n`;
    }
    
    // Insert before </dict>
    plistContent = 
      plistContent.substring(0, dictCloseIndex) +
      entry +
      plistContent.substring(dictCloseIndex);
    
    modified = true;
  }
});

// Write back if modified
if (modified) {
  fs.writeFileSync(PLIST_PATH, plistContent, 'utf8');
  console.log('✅ Info.plist updated successfully!');
  console.log('📱 Your iOS app now supports fullscreen with notch/Dynamic Island');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npx cap sync ios');
  console.log('3. Open Xcode: npx cap open ios');
  console.log('4. Build and test on iPhone with notch (11, 12, 13, 14, 15, 16 Pro)');
} else {
  console.log('ℹ️  No changes needed - Info.plist is already configured');
}

console.log('');
console.log('🔍 Verifying configuration...');

// Verify the required keys exist
const requiredKeys = configs.map(c => c.key);
const missingKeys = requiredKeys.filter(key => !plistContent.includes(`<key>${key}</key>`));

if (missingKeys.length > 0) {
  console.error('⚠️  Warning: Some keys are still missing:', missingKeys.join(', '));
  console.error('   Please add them manually in Xcode');
} else {
  console.log('✅ All required keys are present!');
}

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('📋 IMPORTANT: Manual Steps in Xcode');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('After running this script, open Xcode and verify:');
console.log('');
console.log('1. Open: npx cap open ios');
console.log('2. Select "App" target in Xcode');
console.log('3. Go to "Signing & Capabilities" tab');
console.log('4. Verify "Status Bar Style" is NOT hidden');
console.log('5. In "Deployment Info":');
console.log('   - Uncheck "Requires full screen" if needed');
console.log('   - Check all orientations you want to support');
console.log('   - Status Bar Style: Default (not hidden)');
console.log('');
console.log('6. Build Settings:');
console.log('   - Search "Launch Screen"');
console.log('   - Verify "Launch Screen File" = LaunchScreen');
console.log('');
console.log('7. Test on iPhone with notch (11, 12, 13, 14, 15, 16)');
console.log('   - App should extend behind notch');
console.log('   - Status bar should be visible');
console.log('   - Content respects safe areas');
console.log('');
console.log('═══════════════════════════════════════════════════');
