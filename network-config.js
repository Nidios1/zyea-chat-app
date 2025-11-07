/**
 * ============================================
 * FILE CẤU HÌNH TRUNG TÂM - NETWORK CONFIG
 * ============================================
 * 
 * CHỈ CẦN THAY ĐỔI IP Ở ĐÂY!
 * 
 * Sau khi thay đổi, chạy:
 * npm run sync-ip
 * 
 * Script sẽ tự động cập nhật tất cả các file khác
 */

const os = require('os');

/**
 * ⚙️ CẤU HÌNH CHÍNH - THAY ĐỔI Ở ĐÂY
 */
const NETWORK_CONFIG = {
  // Chế độ: 'auto' hoặc 'manual'
  mode: 'auto', // 'auto' = tự động lấy IP WiFi, 'manual' = dùng IP bên dưới
  
  // IP thủ công (chỉ dùng khi mode = 'manual')
  manualIP: '192.168.0.104',
  
  // Port
  clientPort: 3000,
  serverPort: 5000,
  
  // Protocol
  protocol: 'http',
  httpsProtocol: 'https'
};

/**
 * Lấy IP WiFi hiện tại của máy
 */
function getAutoWiFiIP() {
  const interfaces = os.networkInterfaces();
  
  // Tìm interface Wi-Fi
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

/**
 * Lấy IP dựa trên cấu hình
 */
function getIP() {
  if (NETWORK_CONFIG.mode === 'auto') {
    const autoIP = getAutoWiFiIP();
    if (!autoIP) {
      console.warn('⚠️  Không tìm thấy IP tự động, dùng IP thủ công');
      return NETWORK_CONFIG.manualIP;
    }
    return autoIP;
  }
  return NETWORK_CONFIG.manualIP;
}

// Lấy IP hiện tại
const CURRENT_IP = getIP();

/**
 * ============================================
 * CẤU HÌNH CHO TẤT CẢ CÁC FILE
 * ============================================
 */
const CONFIG = {
  // IP hiện tại
  ip: CURRENT_IP,
  
  // Ports
  clientPort: NETWORK_CONFIG.clientPort,
  serverPort: NETWORK_CONFIG.serverPort,
  
  // URLs
  clientURL: `${NETWORK_CONFIG.protocol}://${CURRENT_IP}:${NETWORK_CONFIG.clientPort}`,
  serverURL: `${NETWORK_CONFIG.protocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}`,
  apiURL: `${NETWORK_CONFIG.protocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}/api`,
  socketURL: `${NETWORK_CONFIG.protocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}`,
  
  // HTTPS URLs
  clientURLSecure: `${NETWORK_CONFIG.httpsProtocol}://${CURRENT_IP}:${NETWORK_CONFIG.clientPort}`,
  serverURLSecure: `${NETWORK_CONFIG.httpsProtocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}`,
  apiURLSecure: `${NETWORK_CONFIG.httpsProtocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}/api`,
  
  // Allowlist cho Capacitor
  allowNavigation: [
    `${NETWORK_CONFIG.protocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}`,
    `${NETWORK_CONFIG.protocol}://${CURRENT_IP}:${NETWORK_CONFIG.clientPort}`,
    `${NETWORK_CONFIG.httpsProtocol}://${CURRENT_IP}:${NETWORK_CONFIG.serverPort}`,
    `${NETWORK_CONFIG.httpsProtocol}://${CURRENT_IP}:${NETWORK_CONFIG.clientPort}`,
    'http://localhost:5000',
    'http://localhost:3000'
  ]
};

module.exports = CONFIG;

// Log config khi import
if (require.main === module) {
  console.log('📡 Network Configuration:');
  console.log('========================');
  console.log(`Mode: ${NETWORK_CONFIG.mode}`);
  console.log(`IP: ${CONFIG.ip}`);
  console.log(`Client: ${CONFIG.clientURL}`);
  console.log(`Server: ${CONFIG.serverURL}`);
  console.log(`API: ${CONFIG.apiURL}`);
  console.log('========================');
}

