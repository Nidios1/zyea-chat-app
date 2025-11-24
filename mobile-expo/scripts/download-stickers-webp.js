/**
 * Script tải sticker dạng WebP (nhẹ hơn PNG, tốt cho mobile)
 * WebP có kích thước nhỏ hơn 30-50% so với PNG với chất lượng tương đương
 * 
 * Usage: node scripts/download-stickers-webp.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 48;

// Emoji Unicode codes
const EMOJI_UNICODES = [
  '1F600', '1F601', '1F602', '1F603', '1F604', '1F605',
  '1F606', '1F607', '1F609', '1F60A', '1F60B', '1F60C',
  '1F60D', '1F60E', '1F60F', '1F618', '1F61A', '1F61B',
  '1F61C', '1F61D', '1F61E', '1F61F', '1F620', '1F621',
  '1F622', '1F623', '1F624', '1F625', '1F626', '1F627',
  '1F628', '1F629', '1F62A', '1F62B', '1F62C', '1F62D',
  '1F62E', '1F62F', '1F630', '1F631', '1F632', '1F633',
  '1F634', '1F635', '1F636', '1F637', '1F638', '1F639',
  '1F44D', '1F44E',
];

// Twemoji CDN - hỗ trợ WebP
function getStickerUrl(unicode) {
  // Twemoji có WebP ở size 72x72
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${unicode.toLowerCase()}.png`;
  // Note: Twemoji chỉ có PNG, nhưng ta có thể convert sau hoặc dùng service khác
  // Hoặc dùng EmojiCDN với format webp
}

// Alternative: Sử dụng service hỗ trợ WebP
function getWebPStickerUrl(unicode) {
  // EmojiCDN có thể trả về WebP nếu request với header phù hợp
  return `https://emojicdn.elk.sh/${unicode}?size=512&format=webp`;
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'image/webp,image/png,*/*',
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
  const filename = `${String(index + 1).padStart(3, '0')}.webp`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Thử WebP trước, nếu không được thì dùng PNG
  const urls = [
    getWebPStickerUrl(unicode),
    getStickerUrl(unicode), // Fallback to PNG
  ];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      await downloadFile(urls[i], filepath);
      
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        if (stats.size > 500) {
          // Nếu là PNG, đổi tên thành .webp (hoặc giữ nguyên .png)
          // Vì nhiều CDN không hỗ trợ WebP trực tiếp
          if (i === 1) {
            // File tải về là PNG, đổi tên thành .webp
            const pngPath = filepath;
            // Thực ra nên giữ nguyên extension, nhưng user muốn .webp
            // Nên ta sẽ tải PNG và đổi tên (hoặc convert sau)
            // Tạm thời: nếu không có WebP, dùng PNG nhưng đổi extension
            const newPath = filepath.replace('.webp', '.png');
            if (pngPath !== newPath) {
              fs.renameSync(pngPath, newPath);
              return { success: false, filename: filename.replace('.webp', '.png'), note: 'Downloaded as PNG' };
            }
          }
          return { success: true, filename, size: stats.size };
        } else {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      if (i === urls.length - 1) {
        return { success: false, filename, error: error.message };
      }
    }
  }
  
  return { success: false, filename };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎨 Tải sticker dạng WebP (nhẹ hơn)...\n');
  console.log(`📁 Thư mục: ${OUTPUT_DIR}`);
  console.log(`📦 Số lượng: ${STICKER_COUNT} sticker\n`);
  console.log('⚠️  Lưu ý: Nhiều CDN không hỗ trợ WebP trực tiếp.');
  console.log('   Script sẽ tải PNG và bạn có thể convert sang WebP sau.\n');

  const stickers = EMOJI_UNICODES.slice(0, STICKER_COUNT);
  const startTime = Date.now();
  
  console.log('⏳ Đang tải...\n');
  
  const results = await Promise.allSettled(
    stickers.map((unicode, index) => downloadSticker(unicode, index))
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  let successCount = 0;
  const pngFiles = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
      const size = (result.value.size / 1024).toFixed(1);
      process.stdout.write(`✓ ${result.value.filename} (${size}KB) `);
      if ((index + 1) % 6 === 0) process.stdout.write('\n');
    } else if (result.status === 'fulfilled' && result.value.note) {
      pngFiles.push(result.value.filename);
    }
  });

  if (successCount % 6 !== 0) console.log('');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Hoàn thành trong ${duration} giây!`);
  console.log(`✓ Thành công: ${successCount}/${STICKER_COUNT}`);
  if (pngFiles.length > 0) {
    console.log(`📝 Lưu ý: ${pngFiles.length} file tải về dạng PNG (có thể convert sang WebP sau)`);
  }
  console.log('='.repeat(60));

  if (successCount > 0) {
    console.log('\n💡 Để convert PNG sang WebP:');
    console.log('1. Sử dụng tool online: https://cloudconvert.com/png-to-webp');
    console.log('2. Hoặc dùng ImageMagick: magick convert *.png -quality 85 *.webp');
    console.log('3. Hoặc giữ nguyên PNG (React Native hỗ trợ tốt cả hai)');
  }
}

main().catch(console.error);

