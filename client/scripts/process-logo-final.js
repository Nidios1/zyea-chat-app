/**
 * Script xử lý logo FINAL: Kết hợp trim với threshold cực cao
 * Loại bỏ hoàn toàn phần trắng xung quanh logo
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoFinal() {
  console.log('🎨 Đang xử lý logo FINAL - loại bỏ hoàn toàn phần trắng...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-final.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-final.jpg`);
    }

    // Chuyển sang PNG với alpha để xử lý tốt hơn
    const pngBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();

    // Thử trim với threshold CỰC CAO để loại bỏ hoàn toàn nền trắng
    let bestResult = null;
    let bestSize = metadata.width * metadata.height;
    const thresholds = [240, 245, 248, 250, 252, 254]; // Threshold cực cao, gần 255
    
    console.log('🔍 Đang thử các threshold cực cao (240-254) để loại bỏ hoàn toàn nền trắng...');
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
        
        // Chỉ chấp nhận nếu kích thước hợp lý và nhỏ hơn kết quả trước
        if (testSize < bestSize && testSize > 50000) { // Ít nhất 50k pixels
          bestSize = testSize;
          bestResult = testResult;
          const reduction = ((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1);
          console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${reduction}%)`);
        }
      } catch (e) {
        // Bỏ qua nếu threshold này không hoạt động
      }
    }
    
    // Nếu không tìm được với threshold cực cao, thử threshold cao
    if (!bestResult) {
      console.log('   ⚠️  Thử threshold cao hơn...');
      const highThresholds = [200, 220, 230, 235];
      for (const threshold of highThresholds) {
        try {
          const testResult = await sharp(pngBuffer)
            .trim({ threshold: threshold })
            .toBuffer();
          
          const testMetadata = await sharp(testResult).metadata();
          const testSize = testMetadata.width * testMetadata.height;
          
          if (testSize < bestSize && testSize > 50000) {
            bestSize = testSize;
            bestResult = testResult;
            const reduction = ((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1);
            console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${reduction}%)`);
          }
        } catch (e) {}
      }
    }
    
    // Nếu vẫn không có kết quả, dùng trim với threshold 250
    if (!bestResult) {
      console.log('   ⚠️  Dùng trim với threshold 250 mặc định');
      bestResult = await sharp(pngBuffer)
        .trim({ threshold: 250 })
        .toBuffer();
    }
    
    // Lấy metadata sau khi trim
    const trimmedMetadata = await sharp(bestResult).metadata();
    console.log(`\n✂️  Kích thước sau khi trim: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
    
    // KHÔNG thêm padding - giữ nguyên để logo sát viền
    // Chuyển về JPEG với chất lượng cao
    const finalImage = await sharp(bestResult)
      .jpeg({ 
        quality: 98,
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
    console.log(`💾 Backup được lưu tại: Zyea-backup-final.jpg`);
    console.log(`\n💡 Logo đã được cắt sát, không còn phần trắng thừa!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoFinal().catch(console.error);

