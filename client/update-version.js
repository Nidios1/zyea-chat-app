#!/usr/bin/env node

/**
 * Script tự động cập nhật version cho iOS App
 * Usage: node update-version.js [version] [build]
 * Example: node update-version.js 1.0.0 2
 */

const fs = require('fs');
const path = require('path');

// Get version and build from command line or use defaults
const args = process.argv.slice(2);
const newVersion = args[0] || '1.0.0';
const newBuild = args[1] || '1';

console.log('\n🔧 iOS Version Updater\n');
console.log(`Target Version: ${newVersion}`);
console.log(`Target Build: ${newBuild}\n`);

// Paths
const projectPbxprojPath = path.join(__dirname, 'ios/App/App.xcodeproj/project.pbxproj');
const packageJsonPath = path.join(__dirname, 'package.json');

// Update package.json
try {
  console.log('📦 Updating package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ package.json updated to ${newVersion}\n`);
} catch (error) {
  console.error('❌ Error updating package.json:', error.message);
}

// Update iOS project.pbxproj
try {
  console.log('🍎 Updating iOS project version...');
  let projectContent = fs.readFileSync(projectPbxprojPath, 'utf8');
  
  // Update MARKETING_VERSION (App Store version)
  const marketingVersionRegex = /MARKETING_VERSION = [^;]+;/g;
  projectContent = projectContent.replace(
    marketingVersionRegex,
    `MARKETING_VERSION = ${newVersion};`
  );
  
  // Update CURRENT_PROJECT_VERSION (Build number)
  const buildVersionRegex = /CURRENT_PROJECT_VERSION = [^;]+;/g;
  projectContent = projectContent.replace(
    buildVersionRegex,
    `CURRENT_PROJECT_VERSION = ${newBuild};`
  );
  
  fs.writeFileSync(projectPbxprojPath, projectContent);
  console.log(`✅ iOS project updated:`);
  console.log(`   MARKETING_VERSION = ${newVersion}`);
  console.log(`   CURRENT_PROJECT_VERSION = ${newBuild}\n`);
} catch (error) {
  console.error('❌ Error updating iOS project:', error.message);
}

// Summary
console.log('📊 Version Update Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ React App Version: ${newVersion}`);
console.log(`✅ iOS App Version: ${newVersion}`);
console.log(`✅ iOS Build Number: ${newBuild}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🚀 Next Steps:');
console.log('1. npm run build:win       - Build React app');
console.log('2. npx cap sync ios        - Sync with iOS');
console.log('3. npx cap open ios        - Open Xcode');
console.log('4. Archive & Export IPA\n');

console.log('✨ Version update complete!\n');

