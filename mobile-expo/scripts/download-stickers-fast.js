/**
 * Fast parallel download script for stickers
 * Downloads 24 stickers in parallel for much faster speed
 * 
 * Usage: node scripts/download-stickers-fast.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 24;

// Emoji Unicode codes
const EMOJI_UNICODES = [
  '1F600', '1F601', '1F602', '1F603', '1F604', '1F605',
  '1F606', '1F607', '1F609', '1F60A', '1F60B', '1F60C',
  '1F60D', '1F60E', '1F60F', '1F618', '1F61A', '1F61B',
  '1F61C', '1F61D', '1F61E', '1F61F', '1F620', '1F621',
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(new Error('Timeout'));
    });
    
    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

async function downloadSticker(unicode, index) {
  const filename = `${String(index + 1).padStart(3, '0')}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Use EmojiCDN - fastest and most reliable
  const url = `https://emojicdn.elk.sh/${unicode}?size=512`;
  
  try {
    await downloadFile(url, filepath);
    
    // Verify file
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size > 1000) { // At least 1KB
        return { success: true, filename, size: stats.size };
      } else {
        fs.unlinkSync(filepath);
      }
    }
    return { success: false, filename, error: 'File too small or invalid' };
  } catch (error) {
    return { success: false, filename, error: error.message };
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Tải sticker nhanh (song song)...\n');
  console.log(`📁 Thư mục: ${OUTPUT_DIR}`);
  console.log(`📦 Số lượng: ${STICKER_COUNT} sticker\n`);

  const stickers = EMOJI_UNICODES.slice(0, STICKER_COUNT);
  const startTime = Date.now();
  
  // Download all stickers in parallel (much faster!)
  console.log('⏳ Đang tải...\n');
  
  const results = await Promise.allSettled(
    stickers.map((unicode, index) => downloadSticker(unicode, index))
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  // Process results
  let successCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
      const size = (result.value.size / 1024).toFixed(1);
      console.log(`✓ [${index + 1}/${STICKER_COUNT}] ${result.value.filename} (${size} KB)`);
    } else {
      failCount++;
      const filename = `${String(index + 1).padStart(3, '0')}.png`;
      console.log(`✗ [${index + 1}/${STICKER_COUNT}] ${filename} - Thất bại`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Hoàn thành trong ${duration} giây`);
  console.log(`✓ Thành công: ${successCount}/${STICKER_COUNT}`);
  if (failCount > 0) {
    console.log(`✗ Thất bại: ${failCount}/${STICKER_COUNT}`);
  }
  console.log('='.repeat(50));

  if (successCount === STICKER_COUNT) {
    console.log('\n🎉 Tất cả sticker đã tải thành công!');
    console.log('\n📝 Bước tiếp theo:');
    console.log('1. Mở file: src/data/stickerData.ts');
    console.log('2. Bỏ dấu // (uncomment) tất cả các dòng require() trong pack "default"');
    console.log('3. Restart app: npm start');
  } else if (successCount > 0) {
    console.log('\n⚠ Một số sticker tải thất bại.');
    console.log('Bạn có thể:');
    console.log('1. Chạy lại script: node scripts/download-stickers-fast.js');
    console.log('2. Hoặc tải thủ công từ: https://openmoji.org/');
  } else {
    console.log('\n❌ Không tải được sticker nào.');
    console.log('Có thể do:');
    console.log('- Mất kết nối internet');
    console.log('- CDN tạm thời không khả dụng');
    console.log('\nGiải pháp:');
    console.log('1. Kiểm tra kết nối internet');
    console.log('2. Thử lại sau vài phút');
    console.log('3. Tải thủ công từ: https://openmoji.org/');
  }
}

main().catch(console.error);

