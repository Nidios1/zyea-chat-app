#!/usr/bin/env node

/**
 * Script để kiểm tra trạng thái server
 */

const http = require('http');
const { exec } = require('child_process');
const os = require('os');

// Lấy IP WiFi
function getWiFiIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wi-fi') || 
        lowerName.includes('wireless') ||
        lowerName.includes('wlan')) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  // Fallback
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// Kiểm tra server có đang chạy không
function checkServer(ip, port = 5000) {
  return new Promise((resolve) => {
    const url = `http://${ip}:${port}/api/health`;
    
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timeout'
      });
    });
  });
}

// Kiểm tra port có đang được sử dụng không
function checkPort(port = 5000) {
  return new Promise((resolve) => {
    const platform = process.platform;
    let command;
    
    if (platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} || netstat -an | grep :${port}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve({ inUse: false, error: error.message });
        return;
      }
      
      const hasOutput = stdout && stdout.trim().length > 0;
      resolve({ inUse: hasOutput, output: stdout });
    });
  });
}

// Main
async function main() {
  console.log('🔍 Đang kiểm tra trạng thái server...\n');
  
  const ip = getWiFiIP();
  console.log(`📱 IP WiFi hiện tại: ${ip}\n`);
  
  // Kiểm tra port
  console.log('1️⃣  Kiểm tra port 5000...');
  const portCheck = await checkPort(5000);
  if (portCheck.inUse) {
    console.log('   ✅ Port 5000 đang được sử dụng');
    if (portCheck.output) {
      console.log(`   📋 Process info:\n${portCheck.output}`);
    }
  } else {
    console.log('   ❌ Port 5000 KHÔNG có process nào đang listen');
    console.log('   ⚠️  Server có thể chưa được khởi động!\n');
    console.log('   💡 Để khởi động server:');
    console.log('      cd ../server');
    console.log('      npm start\n');
  }
  
  // Kiểm tra server response
  console.log('2️⃣  Kiểm tra kết nối đến server...');
  console.log(`   Đang thử kết nối đến: http://${ip}:5000/api/health`);
  
  const serverCheck = await checkServer(ip, 5000);
  
  if (serverCheck.success) {
    console.log(`   ✅ Server đang chạy! Status: ${serverCheck.status}`);
    if (serverCheck.data) {
      console.log(`   📋 Response: ${serverCheck.data}`);
    }
  } else {
    console.log(`   ❌ Không thể kết nối đến server!`);
    console.log(`   ⚠️  Lỗi: ${serverCheck.error}\n`);
    
    console.log('   🔧 Các bước khắc phục:');
    console.log('   1. Kiểm tra server có đang chạy:');
    console.log('      cd ../server');
    console.log('      npm start');
    console.log('   2. Kiểm tra firewall có chặn port 5000 không');
    console.log('   3. Kiểm tra database có đang chạy không (MySQL/XAMPP)');
    console.log('   4. Kiểm tra file config.env có đúng không\n');
  }
  
  // Kiểm tra localhost
  console.log('3️⃣  Kiểm tra localhost...');
  const localhostCheck = await checkServer('localhost', 5000);
  if (localhostCheck.success) {
    console.log(`   ✅ Server có thể truy cập qua localhost`);
  } else {
    console.log(`   ❌ Server không thể truy cập qua localhost`);
  }
  
  console.log('\n📋 Tóm tắt:');
  if (portCheck.inUse && serverCheck.success) {
    console.log('✅ Server đang chạy và có thể truy cập được!');
    console.log(`📱 Mobile app có thể kết nối qua: http://${ip}:5000/api`);
  } else {
    console.log('❌ Server KHÔNG đang chạy hoặc không thể truy cập!');
    console.log('⚠️  Cần khởi động server trước khi sử dụng mobile app.');
  }
}

main().catch(console.error);

