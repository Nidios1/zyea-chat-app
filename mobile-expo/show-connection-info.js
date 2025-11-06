/**
 * Script hiển thị thông tin kết nối để test trên điện thoại
 */

const { networkInterfaces } = require('os');
const fs = require('fs');
const path = require('path');

console.log('\n📱 THÔNG TIN KẾT NỐI ĐỂ TEST TRÊN ĐIỆN THOẠI\n');
console.log('═'.repeat(50));

// Get local IP
const nets = networkInterfaces();
let localIP = '';

for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === 'IPv4' && !net.internal) {
      localIP = net.address;
      break;
    }
  }
  if (localIP) break;
}

console.log('\n🌐 IP Address của máy tính:', localIP || 'Không tìm thấy');
console.log('\n📋 HƯỚNG DẪN KẾT NỐI:\n');

console.log('1️⃣  CÀI ĐẶT EXPO GO:');
console.log('   📱 iOS: https://apps.apple.com/app/expo-go/id982107779');
console.log('   🤖 Android: https://play.google.com/store/apps/details?id=host.exp.exponent');
console.log('');

console.log('2️⃣  KẾT NỐI:');
console.log('   ✅ Đảm bảo điện thoại và máy tính cùng WiFi');
console.log('   ✅ Hoặc Expo đã chạy với --tunnel (đã bật)');
console.log('');

console.log('3️⃣  QUÉT QR CODE:');
console.log('   📷 Mở Expo Go app trên điện thoại');
console.log('   📷 Chọn "Scan QR code"');
console.log('   📷 Quét QR code hiển thị trong terminal Expo');
console.log('');

console.log('4️⃣  HOẶC NHẬP URL THỦ CÔNG:');
if (localIP) {
  console.log(`   🔗 exp://${localIP}:8081`);
} else {
  console.log('   🔗 Xem URL trong terminal Expo');
}
console.log('');

console.log('⚠️  LƯU Ý VỀ OTA UPDATES:');
console.log('   ❌ Expo Go: OTA updates KHÔNG hoạt động');
console.log('   ✅ Development Build: OTA updates hoạt động');
console.log('   ✅ Production Build: OTA updates hoạt động đầy đủ');
console.log('');

console.log('🧪 ĐỂ TEST OTA UPDATES THỰC TẾ:');
console.log('   1. Build production: npm run eas:build:production');
console.log('   2. Cài app lên thiết bị');
console.log('   3. Publish update: npm run update:publish "Test"');
console.log('   4. Mở app - sẽ tự động check update');
console.log('');

console.log('🔍 NẾU GẶP LỖI KẾT NỐI:');
console.log('   • Kiểm tra firewall');
console.log('   • Đảm bảo cùng WiFi');
console.log('   • Thử restart Expo: Ctrl+C rồi chạy lại');
console.log('   • Thử tunnel mode: npx expo start --tunnel');
console.log('');

console.log('═'.repeat(50));
console.log('\n✨ Expo server đang chạy! Quét QR code để bắt đầu test.\n');

