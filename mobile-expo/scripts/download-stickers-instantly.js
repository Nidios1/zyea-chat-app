/**
 * Script tải sticker CỰC NHANH - sử dụng CDN tốt nhất
 * Tải song song tất cả 24 sticker cùng lúc
 * 
 * Usage: node scripts/download-stickers-instantly.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 24;

// Emoji Unicode - sử dụng Noto Emoji (Google) - CDN nhanh và ổn định
const EMOJI_UNICODES = [
  '1F600', '1F601', '1F602', '1F603', '1F604', '1F605',
  '1F606', '1F607', '1F609', '1F60A', '1F60B', '1F60C',
  '1F60D', '1F60E', '1F60F', '1F618', '1F61A', '1F61B',
  '1F61C', '1F61D', '1F61E', '1F61F', '1F620', '1F621',
];

// CDN nhanh nhất - Twemoji (Twitter) - rất nhanh và ổn định
function getStickerUrl(unicode) {
  // Twemoji CDN - nhanh nhất
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${unicode.toLowerCase()}.png`;
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, {
      timeout: 5000, // 5 giây timeout
      headers: {
        'User-Agent': 'Mozilla/5.0',
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    });
    
    request.on('timeout', () => {
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
  const url = getStickerUrl(unicode);
  
  try {
    await downloadFile(url, filepath);
    
    // Verify
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size > 500) { // At least 500 bytes
        return { success: true, filename, size: stats.size };
      } else {
        fs.unlinkSync(filepath);
      }
    }
    return { success: false, filename };
  } catch (error) {
    return { success: false, filename, error: error.message };
  }
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('⚡ Tải sticker CỰC NHANH (song song)...\n');
  console.log(`📁 Thư mục: ${OUTPUT_DIR}`);
  console.log(`📦 Số lượng: ${STICKER_COUNT} sticker`);
  console.log(`🌐 CDN: Twemoji (Twitter) - Nhanh nhất\n`);

  const stickers = EMOJI_UNICODES.slice(0, STICKER_COUNT);
  const startTime = Date.now();
  
  console.log('⏳ Đang tải song song (nhanh hơn nhiều!)...\n');
  
  // Tải TẤT CẢ cùng lúc - nhanh nhất!
  const results = await Promise.allSettled(
    stickers.map((unicode, index) => downloadSticker(unicode, index))
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  // Hiển thị kết quả
  let successCount = 0;
  const successFiles = [];
  const failedFiles = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
      const size = (result.value.size / 1024).toFixed(1);
      successFiles.push(result.value.filename);
      process.stdout.write(`✓ ${result.value.filename} (${size}KB) `);
      if ((index + 1) % 6 === 0) process.stdout.write('\n');
    } else {
      failedFiles.push(`${String(index + 1).padStart(3, '0')}.png`);
    }
  });

  if (successFiles.length % 6 !== 0) console.log('');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Hoàn thành trong ${duration} giây!`);
  console.log(`✓ Thành công: ${successCount}/${STICKER_COUNT}`);
  if (failedFiles.length > 0) {
    console.log(`✗ Thất bại: ${failedFiles.length} file`);
  }
  console.log('='.repeat(60));

  if (successCount === STICKER_COUNT) {
    console.log('\n🎉 TẤT CẢ STICKER ĐÃ TẢI THÀNH CÔNG!');
    console.log('\n📝 Bước tiếp theo:');
    console.log('1. Mở: src/data/stickerData.ts');
    console.log('2. Tìm pack "default" và BỎ DẤU // trước các dòng require()');
    console.log('3. Restart app: npm start');
    console.log('4. Mở chat và nhấn nút sticker để test! 🎨');
  } else if (successCount > 0) {
    console.log('\n⚠ Một số sticker tải thất bại.');
    console.log('Chạy lại script để tải các file còn thiếu:');
    console.log('  node scripts/download-stickers-instantly.js');
  } else {
    console.log('\n❌ Không tải được sticker nào.');
    console.log('Có thể do mất kết nối. Thử lại sau vài giây.');
  }
}

main().catch(console.error);

