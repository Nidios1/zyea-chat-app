/**
 * Script xử lý logo nâng cao: loại bỏ hoàn toàn nền trắng
 * Phát hiện ranh giới nội dung và cắt chính xác
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoAdvanced() {
  console.log('🎨 Đang xử lý logo (chế độ nâng cao)...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup2.jpg');

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File logo.jpg không tồn tại:', inputPath);
    return;
  }

  try {
    // Đọc metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Kích thước ảnh gốc: ${metadata.width}x${metadata.height}`);

    // Backup file Zyea.jpg nếu tồn tại
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup2.jpg`);
    }

    // Chuyển sang PNG với alpha để xử lý tốt hơn
    const pngBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();

    // Thử trim với nhiều threshold, ưu tiên threshold cao hơn để loại bỏ nền trắng
    let bestResult = null;
    let bestSize = metadata.width * metadata.height;
    const thresholds = [30, 40, 50, 60, 70, 80]; // Threshold cao hơn để detect và loại bỏ nền trắng
    
    console.log('🔍 Đang thử các threshold cao để loại bỏ nền trắng...');
    for (const threshold of thresholds) {
      try {
        const testResult = await sharp(pngBuffer)
          .trim({
            threshold: threshold,
            lineArt: false,
          })
          .toBuffer();
        
        const testMetadata = await sharp(testResult).metadata();
        const testSize = testMetadata.width * testMetadata.height;
        
        if (testSize < bestSize && testSize > 0) {
          bestSize = testSize;
          bestResult = testResult;
          const reduction = ((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1);
          console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${reduction}%)`);
        }
      } catch (e) {
        // Bỏ qua nếu threshold này không hoạt động
      }
    }
    
    // Nếu không tìm được, thử threshold thấp hơn
    if (!bestResult) {
      console.log('   ⚠️  Thử threshold thấp hơn...');
      const lowThresholds = [1, 5, 10, 15, 20, 25];
      for (const threshold of lowThresholds) {
        try {
          const testResult = await sharp(pngBuffer)
            .trim({ threshold: threshold })
            .toBuffer();
          
          const testMetadata = await sharp(testResult).metadata();
          const testSize = testMetadata.width * testMetadata.height;
          
          if (testSize < bestSize && testSize > 0) {
            bestSize = testSize;
            bestResult = testResult;
            const reduction = ((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1);
            console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${reduction}%)`);
          }
        } catch (e) {}
      }
    }
    
    // Nếu vẫn không có kết quả, dùng trim mặc định
    if (!bestResult) {
      console.log('   ⚠️  Dùng trim mặc định');
      bestResult = await sharp(pngBuffer)
        .trim({ threshold: 10 })
        .toBuffer();
    }
    
    // Lấy metadata sau khi trim
    const trimmedMetadata = await sharp(bestResult).metadata();
    console.log(`\n✂️  Kích thước sau khi trim: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
    
    // Thêm padding nhỏ (2%) để logo không bị sát viền
    const padding = Math.max(2, Math.round(Math.min(trimmedMetadata.width, trimmedMetadata.height) * 0.02));
    const finalWidth = trimmedMetadata.width + (padding * 2);
    const finalHeight = trimmedMetadata.height + (padding * 2);
    
    // Tạo ảnh với padding và nền trong suốt (hoặc nền trắng nếu cần)
    const finalImage = await sharp(bestResult)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Nền trắng
      })
      .jpeg({ 
        quality: 95,
        mozjpeg: true
      })
      .toBuffer();
    
    // Lưu file
    await sharp(finalImage).toFile(outputPath);
    
    const finalMetadata = await sharp(finalImage).metadata();
    console.log(`📐 Kích thước cuối cùng: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📊 Tổng giảm: từ ${metadata.width}x${metadata.height} xuống ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`   (Giảm ${((1 - (finalMetadata.width * finalMetadata.height) / (metadata.width * metadata.height)) * 100).toFixed(1)}% diện tích)`);
    console.log(`💾 Backup được lưu tại: Zyea-backup2.jpg`);
    console.log(`\n💡 Logo đã được cắt phần thừa và tối ưu hóa!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoAdvanced().catch(console.error);

