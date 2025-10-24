/**
 * Script để tự động cập nhật IP WiFi trong tất cả các file cấu hình
 * Chạy: node update-ip.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Lấy IP WiFi hiện tại
function getCurrentWiFiIP() {
  const interfaces = os.networkInterfaces();
  
  // Tìm interface Wi-Fi
  for (const name of Object.keys(interfaces)) {
    if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless')) {
      for (const iface of interfaces[name]) {
        // Lấy IPv4 và bỏ qua localhost
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  
  // Nếu không tìm thấy Wi-Fi, lấy IP đầu tiên không phải localhost
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return null;
}

// Cập nhật IP trong file
function updateIPInFile(filePath, oldIP, newIP) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const oldContent = content;
    
    // Thay thế tất cả các instance của IP cũ bằng IP mới
    const regex = new RegExp(oldIP.replace(/\./g, '\\.'), 'g');
    content = content.replace(regex, newIP);
    
    if (content !== oldContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Đã cập nhật: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Bỏ qua: ${filePath} (không có thay đổi)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Lỗi khi cập nhật ${filePath}:`, error.message);
    return false;
  }
}

// Danh sách các file cần cập nhật
const filesToUpdate = [
  'server/config.env',
  'client/src/utils/platformConfig.js',
  'client/src/utils/imageUtils.js',
  'client/src/components/Chat/ChatArea.js',
  'client/capacitor.config.ts',
  'client/package.json'
];

// Main function
function main() {
  console.log('🔍 Đang kiểm tra IP WiFi hiện tại...\n');
  
  const currentIP = getCurrentWiFiIP();
  
  if (!currentIP) {
    console.error('❌ Không tìm thấy IP WiFi!');
    process.exit(1);
  }
  
  console.log(`📡 IP WiFi hiện tại: ${currentIP}\n`);
  
  // Đọc IP cũ từ config.env
  const configPath = path.join(__dirname, 'server/config.env');
  const configContent = fs.readFileSync(configPath, 'utf8');
  const match = configContent.match(/SERVER_URL=http:\/\/([\d.]+):/);
  
  if (!match) {
    console.error('❌ Không tìm thấy IP cũ trong config.env');
    process.exit(1);
  }
  
  const oldIP = match[1];
  
  if (oldIP === currentIP) {
    console.log('✅ IP không thay đổi, không cần cập nhật!');
    process.exit(0);
  }
  
  console.log(`🔄 Đang cập nhật từ ${oldIP} sang ${currentIP}...\n`);
  
  let updatedCount = 0;
  
  // Cập nhật từng file
  for (const file of filesToUpdate) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      if (updateIPInFile(filePath, oldIP, currentIP)) {
        updatedCount++;
      }
    } else {
      console.log(`⚠️  Không tìm thấy: ${file}`);
    }
  }
  
  console.log(`\n✅ Hoàn tất! Đã cập nhật ${updatedCount} file(s).`);
  console.log(`\n📝 IP cũ: ${oldIP}`);
  console.log(`📝 IP mới: ${currentIP}`);
  console.log('\n💡 Hãy khởi động lại server và client để áp dụng thay đổi!');
}

// Chạy script
main();

