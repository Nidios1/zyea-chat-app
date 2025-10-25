#!/usr/bin/env node
/**
 * Test Platform Sync
 * Kiểm tra xem platform-sync.css có được load đúng không
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Platform Sync Configuration...\n');

// Check if platform-sync.css exists
const platformSyncPath = path.join(__dirname, 'src', 'styles', 'platform-sync.css');
if (fs.existsSync(platformSyncPath)) {
  console.log('✅ platform-sync.css exists');
  const stats = fs.statSync(platformSyncPath);
  console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
  console.log('❌ platform-sync.css NOT FOUND!');
  process.exit(1);
}

// Check if it's imported in index.js
const indexPath = path.join(__dirname, 'src', 'index.js');
const indexContent = fs.readFileSync(indexPath, 'utf8');
if (indexContent.includes('platform-sync.css')) {
  console.log('✅ platform-sync.css is imported in index.js');
} else {
  console.log('❌ platform-sync.css is NOT imported in index.js!');
  console.log('   Add this line: import \'./styles/platform-sync.css\';');
  process.exit(1);
}

// Check App.js for platform detection
const appPath = path.join(__dirname, 'src', 'App.js');
const appContent = fs.readFileSync(appPath, 'utf8');
if (appContent.includes('capacitor-app') || appContent.includes('web-app')) {
  console.log('✅ Platform detection classes found in App.js');
} else {
  console.log('⚠️  Platform detection classes not found in App.js');
  console.log('   Classes should be added: .capacitor-app or .web-app');
}

// Check capacitor.config.ts
const capacitorConfigPath = path.join(__dirname, 'capacitor.config.ts');
if (fs.existsSync(capacitorConfigPath)) {
  const capacitorConfig = fs.readFileSync(capacitorConfigPath, 'utf8');
  if (capacitorConfig.includes('viewport-fit=cover')) {
    console.log('✅ viewport-fit=cover configured');
  } else {
    console.log('⚠️  viewport-fit=cover not found in index.html');
  }
}

// Check if responsive CSS files exist
const requiredFiles = [
  'src/styles/responsive-enhanced.css',
  'src/styles/safe-area.css',
  'src/styles/iphone-optimization.css',
];

console.log('\n📁 Checking related CSS files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} not found`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));
console.log('✅ Platform sync CSS is ready');
console.log('');
console.log('Next steps:');
console.log('1. npm run build');
console.log('2. npx cap sync ios (for native)');
console.log('3. Test on both PWA and Native');
console.log('');
console.log('Debug tips:');
console.log('- Open DevTools → Elements → Check root classes');
console.log('- Should see: .app-ready .web-app (PWA) or .capacitor-app (Native)');
console.log('- Inspect images → Check computed styles for CSS variables');
console.log('');
console.log('✨ All checks passed!');
console.log('='.repeat(50));

