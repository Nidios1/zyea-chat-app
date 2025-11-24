/**
 * ============================================
 * SCRIPT ĐỒNG BỘ IP TỪ FILE TRUNG TÂM
 * ============================================
 * 
 * Đọc IP từ network-config.js và cập nhật tất cả các file
 * 
 * Chạy: npm run sync-ip
 */

const fs = require('fs');
const path = require('path');
const CONFIG = require('./network-config');

console.log('🔄 BẮT ĐẦU ĐỒNG BỘ IP...\n');
console.log('📡 IP hiện tại:', CONFIG.ip);
console.log('🌐 Client URL:', CONFIG.clientURL);
console.log('🖥️  Server URL:', CONFIG.serverURL);
console.log('🔌 API URL:', CONFIG.apiURL);
console.log('\n' + '='.repeat(50) + '\n');

let updatedCount = 0;
let errorCount = 0;

/**
 * Update file với regex pattern
 */
function updateFile(filePath, patterns, description) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Bỏ qua: ${filePath} (không tồn tại)`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Apply all patterns
    patterns.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    // Check if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${description}`);
      console.log(`   📄 ${filePath}`);
      updatedCount++;
      return true;
    } else {
      console.log(`⏭️  Không thay đổi: ${description}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Lỗi: ${description}`, error.message);
    errorCount++;
    return false;
  }
}

/**
 * 1. Update server/config.env
 */
updateFile(
  path.join(__dirname, 'server/config.env'),
  [
    {
      pattern: /CLIENT_URL=http:\/\/[\d.]+:3000/g,
      replacement: `CLIENT_URL=${CONFIG.clientURL}`
    },
    {
      pattern: /SERVER_URL=http:\/\/[\d.]+:5000/g,
      replacement: `SERVER_URL=${CONFIG.serverURL}`
    }
  ],
  'Server Config (config.env)'
);

/**
 * 2. Update client/src/utils/platformConfig.js
 */
updateFile(
  path.join(__dirname, 'client/src/utils/platformConfig.js'),
  [
    {
      pattern: /let defaultApiUrl = 'http:\/\/[^']+:5000\/api'; \/\/ Fallback - sẽ được sync-ip\.js cập nhật/g,
      replacement: `let defaultApiUrl = '${CONFIG.apiURL}'; // Fallback - sẽ được sync-ip.js cập nhật`
    },
    {
      pattern: /let defaultSocketUrl = 'http:\/\/[^']+:5000'; \/\/ Fallback - sẽ được sync-ip\.js cập nhật/g,
      replacement: `let defaultSocketUrl = '${CONFIG.socketURL}'; // Fallback - sẽ được sync-ip.js cập nhật`
    },
    {
      pattern: /: 'http:\/\/[\d.]+:5000\/api'; \/\/ Fallback - sẽ được sync-ip\.js cập nhật/g,
      replacement: `: '${CONFIG.apiURL}'; // Fallback - sẽ được sync-ip.js cập nhật`
    },
    {
      pattern: /const defaultSocketUrl = 'http:\/\/[\d.]+:5000'; \/\/ Fallback - sẽ được sync-ip\.js cập nhật/g,
      replacement: `const defaultSocketUrl = '${CONFIG.socketURL}'; // Fallback - sẽ được sync-ip.js cập nhật`
    },
    {
      pattern: /const defaultApiUrl = 'http:\/\/[\d.]+:5000\/api';/g,
      replacement: `const defaultApiUrl = '${CONFIG.apiURL}';`
    },
    {
      pattern: /const defaultSocketUrl = 'http:\/\/[\d.]+:5000';/g,
      replacement: `const defaultSocketUrl = '${CONFIG.socketURL}';`
    }
  ],
  'Platform Config (platformConfig.js)'
);

/**
 * 3. Update client/src/utils/imageUtils.js
 */
updateFile(
  path.join(__dirname, 'client/src/utils/imageUtils.js'),
  [
    {
      pattern: /return process\.env\.REACT_APP_SERVER_URL \|\| 'http:\/\/[\d.]+:5000';/g,
      replacement: `return process.env.REACT_APP_SERVER_URL || '${CONFIG.serverURL}';`
    },
    {
      pattern: /return process\.env\.REACT_APP_API_URL \|\| 'http:\/\/[\d.]+:5000\/api';/g,
      replacement: `return process.env.REACT_APP_API_URL || '${CONFIG.apiURL}';`
    }
  ],
  'Image Utils (imageUtils.js)'
);

/**
 * 4. Update client/src/components/Chat/ChatArea.js
 */
updateFile(
  path.join(__dirname, 'client/src/components/Chat/ChatArea.js'),
  [
    {
      pattern: /\$\{process\.env\.REACT_APP_API_URL \|\| 'http:\/\/[\d.]+:5000\/api'\}\/chat\/upload-image/g,
      replacement: `\${process.env.REACT_APP_API_URL || '${CONFIG.apiURL}'}/chat/upload-image`
    }
  ],
  'Chat Area (ChatArea.js)'
);

/**
 * 5. Update client/package.json
 */
updateFile(
  path.join(__dirname, 'client/package.json'),
  [
    {
      pattern: /"proxy": "http:\/\/[\d.]+:5000"/g,
      replacement: `"proxy": "${CONFIG.serverURL}"`
    }
  ],
  'Client Package (package.json)'
);

/**
 * 6. Update client/capacitor.config.ts
 */
const capacitorConfigPath = path.join(__dirname, 'client/capacitor.config.ts');
if (fs.existsSync(capacitorConfigPath)) {
  try {
    let content = fs.readFileSync(capacitorConfigPath, 'utf8');
    const originalContent = content;

    // Find allowNavigation array and replace it
    const allowNavigationPattern = /allowNavigation:\s*\[([\s\S]*?)\]/;
    const match = content.match(allowNavigationPattern);
    
    if (match) {
      const newAllowNavigation = `allowNavigation: [
      '${CONFIG.serverURL}',
      '${CONFIG.clientURL}',
      '${CONFIG.serverURLSecure}',
      '${CONFIG.clientURLSecure}',
      'http://localhost:5000',
      'http://localhost:3000'
    ]`;
      
      content = content.replace(allowNavigationPattern, newAllowNavigation);
      
      if (content !== originalContent) {
        fs.writeFileSync(capacitorConfigPath, content, 'utf8');
        console.log('✅ Capacitor Config (capacitor.config.ts)');
        console.log(`   📄 ${capacitorConfigPath}`);
        updatedCount++;
      } else {
        console.log('⏭️  Không thay đổi: Capacitor Config');
      }
    }
  } catch (error) {
    console.error('❌ Lỗi: Capacitor Config', error.message);
    errorCount++;
  }
}

/**
 * 7. Update mobile-expo/src/config/constants.ts
 */
updateFile(
  path.join(__dirname, 'mobile-expo/src/config/constants.ts'),
  [
    {
      pattern: /return 'http:\/\/[\d.]+:5000\/api';/g,
      replacement: `return '${CONFIG.apiURL}';`
    },
    {
      pattern: /return 'http:\/\/[\d.]+:5000';/g,
      replacement: `return '${CONFIG.socketURL}';`
    },
    {
      pattern: /export const API_BASE_URL = 'http:\/\/[\d.]+:5000\/api';/g,
      replacement: `export const API_BASE_URL = '${CONFIG.apiURL}';`
    },
    {
      pattern: /export const SOCKET_URL = 'http:\/\/[\d.]+:5000';/g,
      replacement: `export const SOCKET_URL = '${CONFIG.socketURL}';`
    }
  ],
  'Mobile Expo Constants (constants.ts)'
);

/**
 * 7b. Update mobile-expo/app.json
 */
updateFile(
  path.join(__dirname, 'mobile-expo/app.json'),
  [
    {
      pattern: /"apiUrl": "http:\/\/[\d.]+:5000\/api",/g,
      replacement: `"apiUrl": "${CONFIG.apiURL}",`
    },
    {
      pattern: /"socketUrl": "http:\/\/[\d.]+:5000"/g,
      replacement: `"socketUrl": "${CONFIG.socketURL}"`
    }
  ],
  'Mobile Expo App Config (app.json)'
);

/**
 * 8. Update server/routes/app.js
 */
updateFile(
  path.join(__dirname, 'server/routes/app.js'),
  [
    {
      pattern: /updateUrl: 'http:\/\/[\d.]+:5000\/api\/app\/download\/latest',/g,
      replacement: `updateUrl: '${CONFIG.apiURL}/app/download/latest',`
    }
  ],
  'Server App Routes (app.js)'
);

/**
 * 8b. Update server/index.js
 */
updateFile(
  path.join(__dirname, 'server/index.js'),
  [
    {
      pattern: /const serverUrl = process\.env\.SERVER_URL \|\| 'http:\/\/[\d.]+:5000';/g,
      replacement: `const serverUrl = process.env.SERVER_URL || '${CONFIG.serverURL}';`
    },
    {
      pattern: /const serverUrl = process\.env\.SERVER_URL \|\| 'http:\/\/localhost:5000';/g,
      replacement: `const serverUrl = process.env.SERVER_URL || '${CONFIG.serverURL}';`
    }
  ],
  'Server Index (index.js)'
);

/**
 * 9. Update START-ALL.bat
 */
updateFile(
  path.join(__dirname, 'START-ALL.bat'),
  [
    {
      pattern: /echo Backend: http:\/\/[\d.]+:5000/g,
      replacement: `echo Backend: ${CONFIG.serverURL}`
    },
    {
      pattern: /echo Frontend: http:\/\/[\d.]+:3000/g,
      replacement: `echo Frontend: ${CONFIG.clientURL}`
    }
  ],
  'Start Script (START-ALL.bat)'
);

/**
 * 9b. Update START-ALL-DOCKER.bat
 */
updateFile(
  path.join(__dirname, 'START-ALL-DOCKER.bat'),
  [
    {
      pattern: /echo Backend: http:\/\/[\d.]+:5000/g,
      replacement: `echo Backend: ${CONFIG.serverURL}`
    },
    {
      pattern: /echo Frontend: http:\/\/[\d.]+:3000/g,
      replacement: `echo Frontend: ${CONFIG.clientURL}`
    }
  ],
  'Start Script Docker (START-ALL-DOCKER.bat)'
);

/**
 * 9c. Update START-SERVER.bat
 */
updateFile(
  path.join(__dirname, 'START-SERVER.bat'),
  [
    {
      pattern: /echo Backend: http:\/\/[\d.]+:5000/g,
      replacement: `echo Backend: ${CONFIG.serverURL}`
    }
  ],
  'Start Server Script (START-SERVER.bat)'
);

/**
 * 10. Update client/src/utils/liveUpdate.js
 */
updateFile(
  path.join(__dirname, 'client/src/utils/liveUpdate.js'),
  [
    {
      pattern: /const response = await fetch\('http:\/\/[\d.]+:5000\/api\/app\/version'\);/g,
      replacement: `const response = await fetch('${CONFIG.apiURL}/app/version');`
    }
  ],
  'Live Update (liveUpdate.js)'
);

/**
 * 11. Update client/src/components/Desktop/DesktopChatArea.js
 */
updateFile(
  path.join(__dirname, 'client/src/components/Desktop/DesktopChatArea.js'),
  [
    {
      pattern: /\$\{process\.env\.REACT_APP_API_URL \|\| 'http:\/\/[\d.]+:5000\/api'\}\/chat\/upload-image/g,
      replacement: `\${process.env.REACT_APP_API_URL || '${CONFIG.apiURL}'}/chat/upload-image`
    }
  ],
  'Desktop Chat Area (DesktopChatArea.js)'
);

/**
 * 12. Update client/src/components/Shared/Chat/ChatArea.js
 */
updateFile(
  path.join(__dirname, 'client/src/components/Shared/Chat/ChatArea.js'),
  [
    {
      pattern: /\$\{process\.env\.REACT_APP_API_URL \|\| 'http:\/\/[\d.]+:5000\/api'\}\/chat\/upload-image/g,
      replacement: `\${process.env.REACT_APP_API_URL || '${CONFIG.apiURL}'}/chat/upload-image`
    }
  ],
  'Shared Chat Area (ChatArea.js)'
);

/**
 * 13. Tạo/Cập nhật .env file cho client (optional)
 */
const envPath = path.join(__dirname, 'client/.env.local');
const envContent = `# Auto-generated from network-config.js
# Chạy 'npm run sync-ip' để cập nhật

REACT_APP_API_URL=${CONFIG.apiURL}
REACT_APP_SOCKET_URL=${CONFIG.socketURL}
REACT_APP_SERVER_URL=${CONFIG.serverURL}
`;

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Environment Variables (.env.local)');
  console.log(`   📄 ${envPath}`);
  updatedCount++;
} catch (error) {
  console.error('❌ Lỗi: .env.local', error.message);
  errorCount++;
}

/**
 * Summary
 */
console.log('\n' + '='.repeat(50));
console.log(`\n📊 KẾT QUẢ:`);
console.log(`   ✅ Đã cập nhật: ${updatedCount} file(s)`);
if (errorCount > 0) {
  console.log(`   ❌ Lỗi: ${errorCount} file(s)`);
}
console.log('\n💡 HƯỚNG DẪN:');
console.log('   1. Khởi động lại server: cd server && npm start');
console.log('   2. Khởi động lại client: cd client && npm start');
console.log('   3. Hoặc: npm run dev (chạy cả 2)');
console.log('\n🎯 ĐỂ THAY ĐỔI IP LẦN SAU:');
console.log('   1. Sửa IP trong file: network-config.js');
console.log('   2. Chạy: npm run sync-ip');
console.log('   3. Khởi động lại server & client');
console.log('='.repeat(50) + '\n');

// Exit with error code if there were errors
process.exit(errorCount > 0 ? 1 : 0);

