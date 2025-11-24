/**
 * Script tự động cập nhật stickerData.ts để dùng .webp thay vì .png
 * 
 * Usage: node scripts/update-sticker-data-for-webp.js
 */

const fs = require('fs');
const path = require('path');

const STICKER_DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'stickerData.ts');
const STICKER_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');

function updateStickerDataFile() {
  // Đọc file hiện tại
  let content = fs.readFileSync(STICKER_DATA_FILE, 'utf8');
  
  // Kiểm tra xem có file .webp không
  const webpFiles = fs.readdirSync(STICKER_DIR)
    .filter(f => f.endsWith('.webp'))
    .map(f => parseInt(f.replace('.webp', '')))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
  
  const pngFiles = fs.readdirSync(STICKER_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => parseInt(f.replace('.png', '')))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
  
  console.log('📊 Phân tích files:');
  console.log(`   WebP: ${webpFiles.length} files`);
  console.log(`   PNG: ${pngFiles.length} files\n`);
  
  if (webpFiles.length === 0 && pngFiles.length > 0) {
    console.log('ℹ️  Chưa có file .webp. Giữ nguyên .png.');
    console.log('💡 Để convert sang WebP:');
    console.log('   1. Cài sharp: npm install sharp');
    console.log('   2. Chạy: node scripts/convert-png-to-webp.js');
    return;
  }
  
  // Nếu có WebP, ưu tiên dùng WebP
  if (webpFiles.length > 0) {
    console.log('🔄 Cập nhật stickerData.ts để dùng .webp...\n');
    
    // Tạo danh sách require mới
    const maxCount = Math.max(...webpFiles, ...pngFiles);
    const requires = [];
    
    for (let i = 1; i <= maxCount; i++) {
      const num = String(i).padStart(3, '0');
      if (webpFiles.includes(i)) {
        requires.push(`      require('../../assets/stickers/default/${num}.webp'),`);
      } else if (pngFiles.includes(i)) {
        requires.push(`      require('../../assets/stickers/default/${num}.png'),`);
      }
    }
    
    // Tìm và thay thế phần stickers array
    const stickersArrayRegex = /stickers:\s*\[([\s\S]*?)\],/;
    const newStickersArray = `stickers: [\n${requires.join('\n')}\n    ],`;
    
    content = content.replace(stickersArrayRegex, newStickersArray);
    
    // Ghi lại file
    fs.writeFileSync(STICKER_DATA_FILE, content, 'utf8');
    
    console.log('✅ Đã cập nhật stickerData.ts!');
    console.log(`   Sử dụng ${webpFiles.length} file .webp và ${pngFiles.length - webpFiles.length} file .png`);
    console.log('\n📝 Bước tiếp theo:');
    console.log('   npx expo start --clear');
  } else {
    console.log('⚠️  Không có file sticker nào!');
  }
}

updateStickerDataFile();

