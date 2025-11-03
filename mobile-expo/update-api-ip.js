#!/usr/bin/env node

/**
 * Script để cập nhật IP trong constants.ts trước khi build IPA
 * 
 * Usage:
 *   node update-api-ip.js 192.168.1.105
 *   hoặc
 *   node update-api-ip.js auto  (tự động lấy IP WiFi)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONSTANTS_FILE = path.join(__dirname, 'src/config/constants.ts');

// Lấy IP từ command line hoặc tự động
function getIP() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Vui lòng cung cấp IP!');
    console.log('\nUsage:');
    console.log('  node update-api-ip.js 192.168.1.105');
    console.log('  node update-api-ip.js auto  (tự động lấy IP WiFi)');
    process.exit(1);
  }
  
  if (args[0] === 'auto') {
    // Tự động lấy IP WiFi
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      if (name.toLowerCase().includes('wi-fi') || 
          name.toLowerCase().includes('wireless') ||
          name.toLowerCase().includes('wlan')) {
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
  
  return args[0];
}

// Cập nhật IP trong constants.ts
function updateIP(newIP) {
  try {
    let content = fs.readFileSync(CONSTANTS_FILE, 'utf8');
    
    // Tìm và thay thế API_BASE_URL
    content = content.replace(
      /export const API_BASE_URL = ['"](.*?)['"]/g,
      `export const API_BASE_URL = 'http://${newIP}:5000/api'`
    );
    
    // Tìm và thay thế SOCKET_URL
    content = content.replace(
      /export const SOCKET_URL = ['"](.*?)['"]/g,
      `export const SOCKET_URL = 'http://${newIP}:5000'`
    );
    
    fs.writeFileSync(CONSTANTS_FILE, content, 'utf8');
    
    console.log('✅ Đã cập nhật IP thành công!');
    console.log(`📱 API_BASE_URL: http://${newIP}:5000/api`);
    console.log(`📱 SOCKET_URL: http://${newIP}:5000`);
    console.log('\n⚠️  Nhớ commit và push code trước khi build IPA!');
    
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật IP:', error.message);
    process.exit(1);
  }
}

// Chạy script
const newIP = getIP();
updateIP(newIP);

