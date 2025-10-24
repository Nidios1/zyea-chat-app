/**
 * Script kiểm tra toàn bộ hệ thống
 * Chạy: npm run check
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const CONFIG = require('./network-config');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║              KIỂM TRA HỆ THỐNG - DIAGNOSTIC                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

let issues = [];
let warnings = [];

// 1. Check IP Configuration
console.log('1️⃣  KIỂM TRA CẤU HÌNH IP:');
console.log(`   📡 IP hiện tại: ${CONFIG.ip}`);
console.log(`   🌐 Client: ${CONFIG.clientURL}`);
console.log(`   🖥️  Server: ${CONFIG.serverURL}`);
console.log(`   🔌 API: ${CONFIG.apiURL}\n`);

// 2. Check files exist and have correct IP
console.log('2️⃣  KIỂM TRA CÁC FILE CẤU HÌNH:');

const filesToCheck = [
  {
    path: 'server/config.env',
    patterns: [CONFIG.clientURL, CONFIG.serverURL]
  },
  {
    path: 'client/src/utils/platformConfig.js',
    patterns: [CONFIG.apiURL, CONFIG.socketURL]
  },
  {
    path: 'client/src/utils/imageUtils.js',
    patterns: [CONFIG.serverURL, CONFIG.apiURL]
  },
  {
    path: 'client/package.json',
    patterns: [CONFIG.serverURL]
  },
  {
    path: 'client/.env.local',
    patterns: [CONFIG.apiURL, CONFIG.socketURL, CONFIG.serverURL]
  }
];

filesToCheck.forEach(({ path: filePath, patterns }) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const allFound = patterns.every(pattern => content.includes(pattern));
    
    if (allFound) {
      console.log(`   ✅ ${filePath}`);
    } else {
      console.log(`   ❌ ${filePath} - IP KHÔNG KHỚP!`);
      issues.push(`File ${filePath} có IP không đúng`);
    }
  } else {
    console.log(`   ⚠️  ${filePath} - KHÔNG TỒN TẠI`);
    warnings.push(`File ${filePath} không tồn tại`);
  }
});

console.log('');

// 3. Check if ports are in use
console.log('3️⃣  KIỂM TRA PORTS:');

exec('netstat -ano | findstr :3000', (error, stdout) => {
  if (stdout) {
    console.log('   ✅ Port 3000 (Client) đang được sử dụng');
  } else {
    console.log('   ❌ Port 3000 (Client) KHÔNG hoạt động');
    issues.push('Client chưa chạy trên port 3000');
  }
});

exec('netstat -ano | findstr :5000', (error, stdout) => {
  if (stdout) {
    console.log('   ✅ Port 5000 (Server) đang được sử dụng');
  } else {
    console.log('   ❌ Port 5000 (Server) KHÔNG hoạt động');
    issues.push('Server chưa chạy trên port 5000');
  }
  
  setTimeout(checkComplete, 1000);
});

function checkComplete() {
  console.log('');
  
  // 4. Check database connection
  console.log('4️⃣  KIỂM TRA DATABASE:');
  const configEnv = fs.readFileSync(path.join(__dirname, 'server/config.env'), 'utf8');
  const dbMatch = configEnv.match(/DB_NAME=(.+)/);
  if (dbMatch) {
    console.log(`   📊 Database: ${dbMatch[1].trim()}`);
  }
  
  console.log('');
  
  // Summary
  console.log('═'.repeat(62));
  console.log('📊 TỔNG KẾT:\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ HỆ THỐNG HOẠT ĐỘNG TỐT!\n');
    console.log('💡 Nếu vẫn không đăng nhập được:');
    console.log('   1. Xóa cache browser (Ctrl + Shift + Delete)');
    console.log('   2. Hard refresh (Ctrl + F5)');
    console.log('   3. Thử chế độ ẩn danh (Incognito)');
    console.log('   4. Kiểm tra Console trong DevTools (F12)\n');
  } else {
    if (issues.length > 0) {
      console.log('❌ VẤN ĐỀ CẦN KHẮC PHỤC:\n');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log('⚠️  CẢNH BÁO:\n');
      warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
      console.log('');
    }
    
    console.log('🔧 CÁCH KHẮC PHỤC:\n');
    console.log('   1. Chạy: npm run sync-ip');
    console.log('   2. Khởi động lại server & client');
    console.log('   3. Xóa cache browser\n');
  }
  
  console.log('═'.repeat(62));
  console.log('\n📝 CÁC LỆNH HỮU ÍCH:\n');
  console.log('   npm run config      → Xem cấu hình');
  console.log('   npm run sync-ip     → Đồng bộ IP');
  console.log('   npm run check       → Kiểm tra hệ thống');
  console.log('   npm run dev         → Khởi động server + client\n');
}

