/**
 * Script xử lý logo: cắt sát logo, loại bỏ hoàn toàn phần trắng thừa
 * Phát hiện ranh giới màu xanh và cắt chính xác
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoTight() {
  console.log('🎨 Đang xử lý logo - cắt sát logo, loại bỏ phần trắng thừa...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup3.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup3.jpg`);
    }

    // Chuyển sang PNG với alpha để xử lý tốt hơn
    const pngBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();

    // Thử trim với threshold rất cao để loại bỏ hoàn toàn nền trắng
    let bestResult = null;
    let bestSize = metadata.width * metadata.height;
    const thresholds = [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 200, 220, 240]; // Threshold rất cao
    
    console.log('🔍 Đang thử các threshold rất cao để loại bỏ hoàn toàn nền trắng...');
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
        
        // Chỉ chấp nhận nếu kích thước hợp lý (không quá nhỏ)
        if (testSize < bestSize && testSize > 10000) {
          bestSize = testSize;
          bestResult = testResult;
          const reduction = ((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1);
          console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${reduction}%)`);
        }
      } catch (e) {
        // Bỏ qua nếu threshold này không hoạt động
      }
    }
    
    // Nếu không tìm được, thử threshold trung bình
    if (!bestResult) {
      console.log('   ⚠️  Thử threshold trung bình...');
      const midThresholds = [50, 60, 70];
      for (const threshold of midThresholds) {
        try {
          const testResult = await sharp(pngBuffer)
            .trim({ threshold: threshold })
            .toBuffer();
          
          const testMetadata = await sharp(testResult).metadata();
          const testSize = testMetadata.width * testMetadata.height;
          
          if (testSize < bestSize && testSize > 10000) {
            bestSize = testSize;
            bestResult = testResult;
            const reduction = ((1 - testSize / (metadata.width * metadata.height)) * 100).toFixed(1);
            console.log(`   ✓ Threshold ${threshold}: ${testMetadata.width}x${testMetadata.height} (giảm ${reduction}%)`);
          }
        } catch (e) {}
      }
    }
    
    // Nếu vẫn không có kết quả, dùng trim mặc định với threshold cao
    if (!bestResult) {
      console.log('   ⚠️  Dùng trim với threshold cao mặc định');
      bestResult = await sharp(pngBuffer)
        .trim({ threshold: 200 })
        .toBuffer();
    }
    
    // Lấy metadata sau khi trim
    const trimmedMetadata = await sharp(bestResult).metadata();
    console.log(`\n✂️  Kích thước sau khi trim: ${trimmedMetadata.width}x${trimmedMetadata.height}`);
    
    // KHÔNG thêm padding - giữ nguyên kích thước đã trim để logo sát viền
    // Chuyển về JPEG với chất lượng cao
    const finalImage = await sharp(bestResult)
      .jpeg({ 
        quality: 98, // Chất lượng rất cao
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
    console.log(`💾 Backup được lưu tại: Zyea-backup3.jpg`);
    console.log(`\n💡 Logo đã được cắt sát, không còn phần trắng thừa!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoTight().catch(console.error);

