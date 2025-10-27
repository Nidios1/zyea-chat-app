#!/usr/bin/env node

/**
 * Debug script để kiểm tra vấn đề authentication
 * Chạy: node debug-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUGGING AUTHENTICATION ISSUE');
console.log('==================================');

// 1. Kiểm tra auth.js
console.log('\n🔐 Checking auth.js...');
const authPath = path.join(__dirname, 'src', 'utils', 'auth.js');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');
  console.log('✅ auth.js exists');
  console.log('📄 auth.js content:');
  console.log(authContent);
} else {
  console.log('❌ auth.js not found');
}

// 2. Kiểm tra App.js authentication logic
console.log('\n⚛️ Checking App.js authentication...');
const appPath = path.join(__dirname, 'src', 'App.js');
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Tìm các patterns liên quan đến auth
  const authPatterns = [
    'getToken',
    'localStorage.getItem',
    'localStorage.setItem',
    'removeToken',
    'login',
    'logout',
    'token verification'
  ];
  
  console.log('✅ App.js exists');
  console.log('🔍 Authentication patterns found:');
  
  authPatterns.forEach(pattern => {
    const matches = appContent.match(new RegExp(pattern, 'g'));
    if (matches) {
      console.log(`  - ${pattern}: ${matches.length} occurrences`);
    }
  });
  
  // Tìm logic verify token
  const tokenVerifyMatch = appContent.match(/if \(token && !user\) \{[\s\S]*?\}/);
  if (tokenVerifyMatch) {
    console.log('✅ Token verification logic found');
  } else {
    console.log('❌ Token verification logic not found');
  }
  
} else {
  console.log('❌ App.js not found');
}

// 3. Kiểm tra capacitor config
console.log('\n📱 Checking Capacitor config...');
const capacitorConfigPath = path.join(__dirname, 'capacitor.config.ts');
if (fs.existsSync(capacitorConfigPath)) {
  const configContent = fs.readFileSync(capacitorConfigPath, 'utf8');
  console.log('✅ capacitor.config.ts exists');
  
  // Tìm API URLs
  const apiUrlMatch = configContent.match(/allowNavigation.*?\[(.*?)\]/s);
  if (apiUrlMatch) {
    console.log('🌐 API URLs configured:', apiUrlMatch[1]);
  }
} else {
  console.log('❌ capacitor.config.ts not found');
}

// 4. Recommendations
console.log('\n💡 RECOMMENDATIONS:');
console.log('==================');
console.log('1. ✅ Check Xcode console for authentication logs');
console.log('2. ✅ Verify API server is running and accessible');
console.log('3. ✅ Check if token is being saved to localStorage');
console.log('4. ✅ Test network connectivity from device');
console.log('5. ✅ Check if token expires too quickly');

console.log('\n🔧 DEBUGGING STEPS:');
console.log('===================');
console.log('1. Open app and check Xcode console');
console.log('2. Look for these logs:');
console.log('   - "🔍 Token check: Token exists"');
console.log('   - "🔐 Verifying existing token..."');
console.log('   - "📡 API Response status: 200"');
console.log('   - "✅ Token valid, user loaded"');
console.log('3. If you see "⏰ Request timeout":');
console.log('   - Check if API server is running');
console.log('   - Verify network connectivity');
console.log('   - Check API URL in capacitor.config.ts');
console.log('4. If you see "No token found":');
console.log('   - Token is not being saved properly');
console.log('   - Check login function');

console.log('\n🌐 API SERVER CHECK:');
console.log('===================');
console.log('Make sure your API server is running on:');
console.log('- http://192.168.0.102:5000');
console.log('- Test with: curl http://192.168.0.102:5000/users/profile');

console.log('\n✨ Debug complete!');

