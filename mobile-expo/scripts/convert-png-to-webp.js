/**
 * Script convert PNG sang WebP để giảm kích thước file
 * WebP nhẹ hơn PNG 30-50% với chất lượng tương đương
 * 
 * Yêu cầu: npm install sharp
 * Usage: node scripts/convert-png-to-webp.js
 */

const fs = require('fs');
const path = require('path');

// Kiểm tra sharp
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp library chưa được cài đặt!');
  console.error('Cài đặt: npm install sharp');
  console.error('\nHoặc sử dụng tool online: https://cloudconvert.com/png-to-webp');
  process.exit(1);
}

const INPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const QUALITY = 85; // Quality 85-90 là tốt nhất

async function convertToWebP(pngPath) {
  const webpPath = pngPath.replace('.png', '.webp');
  
  try {
    await sharp(pngPath)
      .webp({ quality: QUALITY })
      .toFile(webpPath);
    
    const pngStats = fs.statSync(pngPath);
    const webpStats = fs.statSync(webpPath);
    const saved = ((pngStats.size - webpStats.size) / pngStats.size * 100).toFixed(1);
    
    return {
      success: true,
      filename: path.basename(webpPath),
      originalSize: pngStats.size,
      newSize: webpStats.size,
      saved: saved,
    };
  } catch (error) {
    return {
      success: false,
      filename: path.basename(pngPath),
      error: error.message,
    };
  }
}

async function main() {
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('❌ Thư mục không tồn tại:', INPUT_DIR);
    return;
  }

  const pngFiles = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(INPUT_DIR, f));

  if (pngFiles.length === 0) {
    console.log('ℹ️  Không có file PNG nào để convert.');
    return;
  }

  console.log('🔄 Convert PNG sang WebP...\n');
  console.log(`📁 Thư mục: ${INPUT_DIR}`);
  console.log(`📦 Số lượng: ${pngFiles.length} files`);
  console.log(`⚙️  Quality: ${QUALITY}\n`);

  const startTime = Date.now();
  const results = await Promise.allSettled(
    pngFiles.map(file => convertToWebP(file))
  );

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);

  let successCount = 0;
  let totalSaved = 0;
  let totalOriginalSize = 0;
  let totalNewSize = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successCount++;
      const { filename, originalSize, newSize, saved } = result.value;
      totalOriginalSize += originalSize;
      totalNewSize += newSize;
      totalSaved += parseFloat(saved);
      
      const originalKB = (originalSize / 1024).toFixed(1);
      const newKB = (newSize / 1024).toFixed(1);
      
      process.stdout.write(`✓ ${filename} ${originalKB}KB → ${newKB}KB (-${saved}%) `);
      if ((index + 1) % 4 === 0) process.stdout.write('\n');
    } else {
      const filename = result.status === 'fulfilled' 
        ? result.value.filename 
        : path.basename(pngFiles[index]);
      console.log(`✗ ${filename} - ${result.status === 'fulfilled' ? result.value.error : 'Failed'}`);
    }
  });

  if (successCount % 4 !== 0) console.log('');

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Hoàn thành trong ${duration} giây!`);
  console.log(`✓ Thành công: ${successCount}/${pngFiles.length}`);
  if (successCount > 0) {
    const avgSaved = (totalSaved / successCount).toFixed(1);
    const totalSavedKB = ((totalOriginalSize - totalNewSize) / 1024).toFixed(1);
    console.log(`💾 Tiết kiệm: ${totalSavedKB} KB (trung bình -${avgSaved}%)`);
  }
  console.log('='.repeat(60));

  if (successCount === pngFiles.length) {
    console.log('\n📝 Bước tiếp theo:');
    console.log('1. Mở: src/data/stickerData.ts');
    console.log('2. Đổi tất cả .png thành .webp trong các require()');
    console.log('3. (Tùy chọn) Xóa file PNG cũ: del assets\\stickers\\default\\*.png');
    console.log('4. Restart app: npm start');
  }
}

main().catch(console.error);

