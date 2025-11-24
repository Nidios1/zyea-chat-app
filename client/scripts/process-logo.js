/**
 * Script xử lý logo: cắt phần thừa và tối ưu hóa
 * Tự động detect và loại bỏ whitespace/transparent areas
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogo() {
  console.log('🎨 Đang xử lý logo...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup.jpg');

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File logo.jpg không tồn tại:', inputPath);
    return;
  }

  try {
    // Đọc metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Kích thước ảnh gốc: ${metadata.width}x${metadata.height}`);
    console.log(`📄 Format: ${metadata.format}`);

    // Backup file Zyea.jpg nếu tồn tại
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup.jpg`);
    }

    // Xử lý ảnh: tự động trim whitespace và tối ưu
    // Chuyển sang PNG với alpha channel để xử lý tốt hơn
    const pngBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();
    
    // Thử nhiều threshold để tìm kết quả tốt nhất
    let bestResult = null;
    let bestSize = metadata.width * metadata.height;
    const thresholds = [1, 3, 5, 10, 15, 20, 25]; // Thử các threshold khác nhau
    
    console.log('🔍 Đang thử các threshold khác nhau...');
    for (const threshold of thresholds) {
      try {
        const testResult = await sharp(pngBuffer)
          .trim({
            threshold: threshold, // Threshold để detect background (0-255, càng thấp càng nhạy)
            lineArt: false, // Không phải line art
          })
          .toBuffer();
        
        const testMetadata = await sharp(testResult).metadata();
        const testSize = testMetadata.width * testMetadata.height;
        
        if (testSize < bestSize) {
          bestSize = testSize;
          bestResult = testResult;
          console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1)}%)`);
        }
      } catch (e) {
        // Bỏ qua nếu threshold này không hoạt động
      }
    }
    
    // Nếu không tìm được kết quả tốt, dùng threshold mặc định
    if (!bestResult) {
      console.log('   ⚠️  Dùng threshold mặc định');
      bestResult = await sharp(pngBuffer)
        .trim({ threshold: 10 })
        .toBuffer();
    }
    
    // Tối ưu hóa và chuyển về JPEG (với nền trắng nếu cần)
    // Hoặc giữ PNG nếu muốn transparent background
    const processed = await sharp(bestResult)
      .jpeg({ 
        quality: 95, // Chất lượng cao
        mozjpeg: true // Tối ưu hóa với mozjpeg
      })
      .toBuffer();

    // Lấy metadata sau khi trim
    const trimmedMetadata = await sharp(processed).metadata();
    console.log(`✂️  Kích thước sau khi trim: ${trimmedMetadata.width}x${trimmedMetadata.height}`);

    // Lưu file
    await sharp(processed).toFile(outputPath);

    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📐 Đã giảm từ ${metadata.width}x${metadata.height} xuống ${trimmedMetadata.width}x${trimmedMetadata.height}`);
    console.log(`💾 Backup được lưu tại: Zyea-backup.jpg`);
    console.log(`\n💡 Logo đã được cắt phần thừa và tối ưu hóa!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogo().catch(console.error);

