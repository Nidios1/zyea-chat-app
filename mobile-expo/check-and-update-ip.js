#!/usr/bin/env node

/**
 * Script để kiểm tra và cập nhật IP WiFi trong tất cả các file config
 * 
 * Usage:
 *   node check-and-update-ip.js [new-ip]
 *   node check-and-update-ip.js auto  (tự động lấy IP WiFi)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Danh sách các file cần kiểm tra và cập nhật
const FILES_TO_CHECK = [
  {
    path: path.join(__dirname, 'src/config/constants.ts'),
    patterns: [
      { regex: /export const API_BASE_URL = ['"](.*?)['"]/g, replace: (ip) => `export const API_BASE_URL = 'http://${ip}:5000/api'` },
      { regex: /export const SOCKET_URL = ['"](.*?)['"]/g, replace: (ip) => `export const SOCKET_URL = 'http://${ip}:5000'` },
    ],
    name: 'Mobile App Config (constants.ts)'
  },
  {
    path: path.join(__dirname, '../server/config.env'),
    patterns: [
      { regex: /CLIENT_URL=http:\/\/(\d+\.\d+\.\d+\.\d+):3000/g, replace: (ip) => `CLIENT_URL=http://${ip}:3000` },
      { regex: /SERVER_URL=http:\/\/(\d+\.\d+\.\d+\.\d+):5000/g, replace: (ip) => `SERVER_URL=http://${ip}:5000` },
    ],
    name: 'Server Config (config.env)'
  },
];

// Lấy IP từ command line hoặc tự động
function getIP() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Không có argument, chỉ kiểm tra IP hiện tại
    return null;
  }
  
  if (args[0] === 'auto') {
    // Tự động lấy IP WiFi
    const interfaces = os.networkInterfaces();
    
    // Ưu tiên tìm WiFi adapter
    for (const name of Object.keys(interfaces)) {
      const lowerName = name.toLowerCase();
      if (lowerName.includes('wi-fi') || 
          lowerName.includes('wireless') ||
          lowerName.includes('wlan') ||
          lowerName.includes('ethernet')) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
    }
    
    // Fallback: lấy IP đầu tiên không phải localhost
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    
    console.error('❌ Không tìm thấy IP tự động!');
    process.exit(1);
  }
  
  // Validate IP format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(args[0])) {
    console.error('❌ IP không hợp lệ!');
    process.exit(1);
  }
  
  return args[0];
}

// Lấy IP hiện tại từ file
function getCurrentIP(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(pattern.regex);
    if (match) {
      // Extract IP from URL
      const urlMatch = match[0].match(/(\d+\.\d+\.\d+\.\d+)/);
      return urlMatch ? urlMatch[1] : null;
    }
  } catch (error) {
    // File không tồn tại
    return null;
  }
  return null;
}

// Kiểm tra IP trong tất cả các file
function checkIPs() {
  console.log('🔍 Đang kiểm tra IP trong các file config...\n');
  
  const results = [];
  
  for (const file of FILES_TO_CHECK) {
    const fileIPs = [];
    
    for (const pattern of file.patterns) {
      const currentIP = getCurrentIP(file.path, pattern);
      if (currentIP) {
        fileIPs.push(currentIP);
      }
    }
    
    // Lấy IP duy nhất
    const uniqueIPs = [...new Set(fileIPs)];
    
    results.push({
      name: file.name,
      path: file.path,
      ips: uniqueIPs,
      exists: fs.existsSync(file.path)
    });
  }
  
  // Hiển thị kết quả
  for (const result of results) {
    if (!result.exists) {
      console.log(`⚠️  ${result.name}`);
      console.log(`   File không tồn tại: ${result.path}\n`);
      continue;
    }
    
    if (result.ips.length === 0) {
      console.log(`❌ ${result.name}`);
      console.log(`   Không tìm thấy IP trong file\n`);
    } else if (result.ips.length === 1) {
      console.log(`✅ ${result.name}`);
      console.log(`   IP: ${result.ips[0]}\n`);
    } else {
      console.log(`⚠️  ${result.name}`);
      console.log(`   Nhiều IP khác nhau: ${result.ips.join(', ')}\n`);
    }
  }
  
  // Kiểm tra xem tất cả IP có giống nhau không
  const allIPs = results.flatMap(r => r.ips);
  const uniqueAllIPs = [...new Set(allIPs)];
  
  if (uniqueAllIPs.length === 1) {
    console.log(`✅ Tất cả các file đều dùng IP: ${uniqueAllIPs[0]}\n`);
  } else if (uniqueAllIPs.length > 1) {
    console.log(`⚠️  Có nhiều IP khác nhau trong các file: ${uniqueAllIPs.join(', ')}\n`);
  }
  
  return uniqueAllIPs;
}

// Cập nhật IP trong file
function updateIPInFile(filePath, patterns, newIP) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const pattern of patterns) {
      const newContent = content.replace(pattern.regex, (match) => {
        updated = true;
        return pattern.replace(newIP);
      });
      
      if (newContent !== content) {
        content = newContent;
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật file ${filePath}:`, error.message);
    return false;
  }
}

// Cập nhật IP trong tất cả các file
function updateIPs(newIP) {
  console.log(`\n🔄 Đang cập nhật IP thành: ${newIP}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of FILES_TO_CHECK) {
    if (!fs.existsSync(file.path)) {
      console.log(`⚠️  Bỏ qua: ${file.name} (file không tồn tại)`);
      continue;
    }
    
    const updated = updateIPInFile(file.path, file.patterns, newIP);
    
    if (updated) {
      console.log(`✅ Đã cập nhật: ${file.name}`);
      successCount++;
    } else {
      console.log(`⚠️  Không tìm thấy pattern để cập nhật: ${file.name}`);
      failCount++;
    }
  }
  
  console.log(`\n✅ Đã cập nhật ${successCount} file(s)`);
  if (failCount > 0) {
    console.log(`⚠️  ${failCount} file(s) không thể cập nhật`);
  }
}

// Main
const newIP = getIP();

if (newIP) {
  // Cập nhật IP
  updateIPs(newIP);
  console.log('\n📋 Kiểm tra lại sau khi cập nhật:\n');
  checkIPs();
} else {
  // Chỉ kiểm tra
  checkIPs();
  console.log('\n💡 Để cập nhật IP, chạy:');
  console.log('   node check-and-update-ip.js auto  (tự động lấy IP WiFi)');
  console.log('   node check-and-update-ip.js 192.168.1.105  (cập nhật IP cụ thể)');
}

