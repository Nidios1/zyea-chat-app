/**
 * Script kiểm tra chức năng Video Call
 * Chạy script này để verify các component và dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra chức năng Video Call...\n');

// Kiểm tra các file đã được tạo
const requiredFiles = [
  'client/src/components/Chat/VideoCall.js',
  'server/index.js',
  'VIDEO-CALL-GUIDE.md'
];

let allFilesExist = true;

console.log('📁 Kiểm tra các file cần thiết:\n');

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ❌ ${file} - KHÔNG TÌM THẤY`);
    allFilesExist = false;
  }
});

console.log('\n');

// Kiểm tra socket events trong server
console.log('🔌 Kiểm tra Socket Events trong Server:\n');

const serverPath = path.join(__dirname, 'server/index.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

const requiredSocketEvents = [
  'call-offer',
  'call-answer',
  'ice-candidate',
  'end-call',
  'call-rejected'
];

requiredSocketEvents.forEach(event => {
  if (serverContent.includes(`socket.on('${event}'`)) {
    console.log(`  ✅ ${event} - Đã được implement`);
  } else {
    console.log(`  ❌ ${event} - CHƯA được implement`);
  }
});

console.log('\n');

// Kiểm tra component imports
console.log('📦 Kiểm tra Component Imports:\n');

const chatAreaPath = path.join(__dirname, 'client/src/components/Chat/ChatArea.js');
const chatAreaContent = fs.readFileSync(chatAreaPath, 'utf8');

if (chatAreaContent.includes("import VideoCall from './VideoCall'")) {
  console.log('  ✅ VideoCall component đã được import vào ChatArea');
} else {
  console.log('  ❌ VideoCall component CHƯA được import vào ChatArea');
}

const mobileContactsPath = path.join(__dirname, 'client/src/components/Mobile/MobileContacts.js');
const mobileContactsContent = fs.readFileSync(mobileContactsPath, 'utf8');

if (mobileContactsContent.includes("import VideoCall from '../Chat/VideoCall'")) {
  console.log('  ✅ VideoCall component đã được import vào MobileContacts');
} else {
  console.log('  ❌ VideoCall component CHƯA được import vào MobileContacts');
}

console.log('\n');

// Kiểm tra WebRTC dependencies
console.log('🌐 Kiểm tra WebRTC Configuration:\n');

const videoCallPath = path.join(__dirname, 'client/src/components/Chat/VideoCall.js');
const videoCallContent = fs.readFileSync(videoCallPath, 'utf8');

const webrtcFeatures = [
  { name: 'RTCPeerConnection', check: 'RTCPeerConnection' },
  { name: 'getUserMedia', check: 'getUserMedia' },
  { name: 'STUN Server', check: 'stun:stun.l.google.com' },
  { name: 'ICE Candidates', check: 'onicecandidate' },
  { name: 'Remote Stream', check: 'ontrack' }
];

webrtcFeatures.forEach(feature => {
  if (videoCallContent.includes(feature.check)) {
    console.log(`  ✅ ${feature.name} - Đã được implement`);
  } else {
    console.log(`  ❌ ${feature.name} - CHƯA được implement`);
  }
});

console.log('\n');

// Tóm tắt
if (allFilesExist) {
  console.log('✨ Kết quả: TẤT CẢ FILE CẦN THIẾT ĐÃ TỒN TẠI!\n');
  console.log('📝 Các bước tiếp theo:\n');
  console.log('  1. Khởi động server: cd server && npm start');
  console.log('  2. Khởi động client: cd client && npm start');
  console.log('  3. Đăng nhập 2 tài khoản khác nhau');
  console.log('  4. Thử gọi video/audio giữa 2 tài khoản');
  console.log('  5. Đọc VIDEO-CALL-GUIDE.md để biết thêm chi tiết\n');
  console.log('🎉 Chúc bạn test thành công!');
} else {
  console.log('⚠️  Cảnh báo: Một số file còn thiếu. Vui lòng kiểm tra lại!\n');
}

console.log('\n' + '='.repeat(60) + '\n');

