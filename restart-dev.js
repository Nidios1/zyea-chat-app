/**
 * Script để restart development servers
 * Chạy: npm run restart-dev
 */

const { exec } = require('child_process');
const os = require('os');

console.log('🔄 ĐANG DỪNG CÁC PROCESS CŨ...\n');

// Kill all node processes on port 3000 and 5000
const killCommands = os.platform() === 'win32' 
  ? [
      'FOR /F "tokens=5" %P IN (\'netstat -ano ^| findstr :3000\') DO @TaskKill /PID %P /F 2>nul',
      'FOR /F "tokens=5" %P IN (\'netstat -ano ^| findstr :5000\') DO @TaskKill /PID %P /F 2>nul'
    ]
  : [
      'lsof -ti:3000 | xargs kill -9 2>/dev/null || true',
      'lsof -ti:5000 | xargs kill -9 2>/dev/null || true'
    ];

killCommands.forEach(cmd => {
  try {
    exec(cmd, (error) => {
      if (error) {
        // Ignore errors (process might not exist)
      }
    });
  } catch (e) {
    // Ignore
  }
});

console.log('⏳ Đợi 2 giây...\n');

setTimeout(() => {
  console.log('✅ Đã dừng process cũ!\n');
  console.log('📝 HƯỚNG DẪN KHỞI ĐỘNG LẠI:\n');
  console.log('   Terminal 1 - Server:');
  console.log('   cd server');
  console.log('   npm start\n');
  console.log('   Terminal 2 - Client:');
  console.log('   cd client');
  console.log('   npm start\n');
  console.log('   HOẶC chạy cả 2 cùng lúc:');
  console.log('   npm run dev\n');
  console.log('💡 LƯU Ý: Sau khi khởi động, xóa cache browser (Ctrl+F5)\n');
}, 2000);

