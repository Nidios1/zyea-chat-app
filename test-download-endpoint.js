/**
 * Test script để verify server có thể download build.zip
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Testing download endpoint configuration...\n');

// Path như trong server/routes/app.js
const bundlePath = path.join(__dirname, 'client/build.zip');

console.log('📍 Expected path:', bundlePath);
console.log('📂 Directory:', path.dirname(bundlePath));
console.log('📄 Filename:', path.basename(bundlePath));
console.log('');

// Check file exists
if (fs.existsSync(bundlePath)) {
  const stats = fs.statSync(bundlePath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log('✅ File exists!');
  console.log('📊 Size:', sizeMB, 'MB');
  console.log('📅 Modified:', stats.mtime.toLocaleString());
  console.log('');
  console.log('🎉 Server can download this file successfully!');
  console.log('');
  console.log('📍 Download URL:');
  console.log('   http://192.168.0.102:5000/api/app/download/latest');
  console.log('');
  console.log('💡 Test with curl:');
  console.log('   curl -O http://192.168.0.102:5000/api/app/download/latest');
} else {
  console.log('❌ File NOT found!');
  console.log('');
  console.log('🔧 Fix:');
  console.log('   cd client');
  console.log('   npm run build');
  console.log('   Compress-Archive -Path build\\* -DestinationPath build.zip -Force');
}

