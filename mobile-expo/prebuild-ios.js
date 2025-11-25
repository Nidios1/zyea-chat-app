#!/usr/bin/env node

/**
 * Script to prebuild iOS native folder
 * This creates the ios/ folder with Xcode project structure
 * 
 * NOTE: iOS prebuild can only run on macOS/Linux, not Windows!
 * On Windows, this will show instructions instead.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔨 Prebuilding iOS native project...\n');

const mobileExpoDir = __dirname;
const iosDir = path.join(mobileExpoDir, 'ios');

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Check if running on Windows
if (isWindows) {
  console.log('⚠️  WARNING: iOS prebuild cannot run on Windows!');
  console.log('');
  console.log('📋 Options:');
  console.log('   1. Run prebuild on macOS/Linux machine');
  console.log('   2. Let GitHub Actions prebuild it automatically (recommended)');
  console.log('   3. Use EAS Build (cloud build) instead');
  console.log('');
  console.log('💡 GitHub Actions workflow will automatically prebuild ios/ folder');
  console.log('   when you push to the repository.');
  console.log('');
  console.log('🔍 Checking if ios/ folder exists...');
  
  if (fs.existsSync(iosDir)) {
    const files = fs.readdirSync(iosDir);
    if (files.length > 1 || (files.length === 1 && !files.includes('exportOptions.plist'))) {
      console.log('✅ ios/ folder exists with native files');
      console.log('📂 Contents:');
      files.forEach(file => {
        const filePath = path.join(iosDir, file);
        const stat = fs.statSync(filePath);
        const type = stat.isDirectory() ? '📁' : '📄';
        console.log(`  ${type} ${file}`);
      });
    } else {
      console.log('⚠️  ios/ folder only contains exportOptions.plist');
      console.log('   Native iOS project files are missing.');
    }
  } else {
    console.log('❌ ios/ folder does not exist');
    console.log('   It will be created by GitHub Actions on next push.');
  }
  
  console.log('');
  process.exit(0);
}

// Check if ios/ already exists
if (fs.existsSync(iosDir)) {
  console.log('⚠️  ios/ folder already exists');
  console.log('💡 To regenerate, delete ios/ folder first or use --clean flag\n');
}

try {
  console.log('📦 Running: npx expo prebuild --platform ios --clean\n');
  
  execSync('npx expo prebuild --platform ios --clean', {
    cwd: mobileExpoDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure we're in the right directory
      PWD: mobileExpoDir,
    }
  });
  
  console.log('\n✅ Prebuild completed successfully!\n');
  
  // Verify ios/ folder was created
  if (fs.existsSync(iosDir)) {
    console.log('📂 ios/ folder structure:');
    const files = fs.readdirSync(iosDir);
    files.forEach(file => {
      const filePath = path.join(iosDir, file);
      const stat = fs.statSync(filePath);
      const type = stat.isDirectory() ? '📁' : '📄';
      console.log(`  ${type} ${file}`);
    });
    
    // Check for .xcworkspace
    const workspaceFiles = fs.readdirSync(iosDir).filter(f => f.endsWith('.xcworkspace'));
    if (workspaceFiles.length > 0) {
      console.log(`\n✅ Found .xcworkspace: ${workspaceFiles[0]}`);
    } else {
      console.log('\n⚠️  No .xcworkspace found (this might be normal if using .xcodeproj)');
    }
    
    // Check for .xcodeproj
    const projectFiles = fs.readdirSync(iosDir).filter(f => f.endsWith('.xcodeproj'));
    if (projectFiles.length > 0) {
      console.log(`✅ Found .xcodeproj: ${projectFiles[0]}`);
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. Run: cd ios && pod install');
    console.log('   2. Open .xcworkspace in Xcode');
    console.log('   3. Or build with: npx expo run:ios\n');
  } else {
    console.error('\n❌ ERROR: ios/ folder was not created!');
    process.exit(1);
  }
  
} catch (error) {
  console.error('\n❌ Prebuild failed!');
  console.error(error.message);
  process.exit(1);
}

