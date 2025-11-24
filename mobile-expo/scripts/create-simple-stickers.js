/**
 * Tạo sticker đơn giản từ emoji để test ngay
 * Không cần tải từ internet - tạo placeholder nhanh
 * 
 * Usage: node scripts/create-simple-stickers.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 24;

// Emoji characters (sẽ được hiển thị trong app)
const EMOJIS = [
  '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇',
  '😉', '😊', '😋', '😌', '😍', '😎', '😏', '😘',
  '😗', '😙', '😚', '😛', '😜', '😝', '😞', '😟',
];

// Tạo file metadata để app có thể hiển thị emoji thay vì ảnh
// Đây là giải pháp tạm thời để test ngay mà không cần tải ảnh

function createStickerMetadata() {
  const metadata = {
    packId: 'default',
    title: 'Default Stickers',
    stickers: EMOJIS.map((emoji, index) => ({
      index,
      emoji,
      filename: `${String(index + 1).padStart(3, '0')}.png`,
      placeholder: true, // Đánh dấu là placeholder
    })),
  };

  const metadataPath = path.join(OUTPUT_DIR, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('✓ Created metadata.json');
}

// Tạo file README với hướng dẫn
function createReadme() {
  const readme = `# Default Stickers - Placeholder Mode

Các file PNG hiện tại là placeholder. Để có sticker thật:

## Cách 1: Tải tự động (Nhanh nhất)
\`\`\`bash
node scripts/download-stickers-fast.js
\`\`\`

## Cách 2: Tải thủ công
1. Truy cập: https://openmoji.org/
2. Tải 24 emoji PNG (512x512px, nền trong suốt)
3. Đặt tên: 001.png, 002.png, ..., 024.png
4. Copy vào thư mục này

## Cách 3: Sử dụng emoji hiện tại
App sẽ hiển thị emoji text thay vì ảnh nếu file không tồn tại hoặc không hợp lệ.
`;

  const readmePath = path.join(OUTPUT_DIR, 'README.txt');
  fs.writeFileSync(readmePath, readme);
  console.log('✓ Created README.txt');
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('📦 Tạo sticker placeholder...\n');
  
  // Xóa các file cũ nếu có (file rỗng)
  const oldFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  oldFiles.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = fs.statSync(filePath);
    if (stats.size < 100) { // File quá nhỏ = file rỗng
      fs.unlinkSync(filePath);
      console.log(`🗑️  Xóa file rỗng: ${file}`);
    }
  });

  createStickerMetadata();
  createReadme();

  console.log('\n✅ Hoàn thành!');
  console.log('\n💡 Lưu ý:');
  console.log('- Các file PNG hiện tại là placeholder');
  console.log('- Để có sticker thật, chạy: node scripts/download-stickers-fast.js');
  console.log('- Hoặc tải thủ công từ: https://openmoji.org/');
  console.log('\n📝 Bước tiếp theo:');
  console.log('1. Mở: src/data/stickerData.ts');
  console.log('2. Uncomment các dòng require() trong pack "default"');
  console.log('3. Restart app để test');
}

main().catch(console.error);

