/**
 * Script tải thêm sticker pack phong phú hơn
 * Tải nhiều sticker hơn (48-72 sticker) để có đủ sticker như trong ảnh
 * 
 * Usage: node scripts/download-more-stickers.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 48; // Tăng lên 48 sticker để phong phú hơn

// Mở rộng danh sách emoji - thêm nhiều emoji hơn
const EMOJI_UNICODES = [
  // Happy faces
  '1F600', '1F601', '1F602', '1F603', '1F604', '1F605',
  '1F606', '1F607', '1F609', '1F60A', '1F60B', '1F60C',
  '1F60D', '1F60E', '1F60F', '1F618', '1F61A', '1F61B',
  '1F61C', '1F61D', '1F61E', '1F61F', '1F620', '1F621',
  // More expressions
  '1F622', '1F623', '1F624', '1F625', '1F626', '1F627',
  '1F628', '1F629', '1F62A', '1F62B', '1F62C', '1F62D',
  '1F62E', '1F62F', '1F630', '1F631', '1F632', '1F633',
  '1F634', '1F635', '1F636', '1F637', '1F638', '1F639',
  // Gestures and actions
  '1F44D', '1F44E', '1F44F', '1F450', '1F64C', '1F64F',
  '1F91D', '1F91E', '1F91F', '1F918', '1F919', '1F91A',
];

// Twemoji CDN - nhanh và ổn định
function getStickerUrl(unicode) {
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${unicode.toLowerCase()}.png`;
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, {
      timeout: 5000,
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
    
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      if (stats.size > 500) {
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

  console.log('🎨 Tải sticker pack phong phú hơn...\n');
  console.log(`📁 Thư mục: ${OUTPUT_DIR}`);
  console.log(`📦 Số lượng: ${STICKER_COUNT} sticker\n`);

  const stickers = EMOJI_UNICODES.slice(0, STICKER_COUNT);
  const startTime = Date.now();
  
  console.log('⏳ Đang tải song song...\n');
  
  // Tải song song để nhanh
  const results = await Promise.allSettled(
    stickers.map((unicode, index) => downloadSticker(unicode, index))
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  let successCount = 0;
  const successFiles = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
      const size = (result.value.size / 1024).toFixed(1);
      successFiles.push(result.value.filename);
      process.stdout.write(`✓ ${result.value.filename} `);
      if ((index + 1) % 8 === 0) process.stdout.write('\n');
    }
  });

  if (successFiles.length % 8 !== 0) console.log('');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Hoàn thành trong ${duration} giây!`);
  console.log(`✓ Thành công: ${successCount}/${STICKER_COUNT}`);
  console.log('='.repeat(60));

  if (successCount === STICKER_COUNT) {
    console.log('\n🎉 TẤT CẢ STICKER ĐÃ TẢI THÀNH CÔNG!');
    console.log('\n📝 Bước tiếp theo:');
    console.log('1. Mở: src/data/stickerData.ts');
    console.log('2. Cập nhật pack "default" với tất cả require() từ 001.png đến 048.png');
    console.log('3. Restart app: npm start');
  } else if (successCount > 0) {
    console.log('\n⚠ Một số sticker tải thất bại.');
    console.log('Chạy lại script để tải các file còn thiếu.');
  }
}

main().catch(console.error);

