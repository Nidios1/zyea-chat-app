/**
 * Script xử lý logo: Trim nhiều lần với các threshold khác nhau
 * Loại bỏ hoàn toàn phần trắng bằng cách trim lặp lại
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoMultiTrim() {
  console.log('🎨 Đang xử lý logo - trim nhiều lần để loại bỏ hoàn toàn phần trắng...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-multi.jpg');

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File logo.jpg không tồn tại:', inputPath);
    return;
  }

  try {
    // Đọc metadata
    let currentMetadata = await sharp(inputPath).metadata();
    console.log(`📐 Kích thước ảnh gốc: ${currentMetadata.width}x${currentMetadata.height}`);

    // Backup file Zyea.jpg nếu tồn tại
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-multi.jpg`);
    }

    // Chuyển sang PNG với alpha
    let currentBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();

    // Trim nhiều lần với threshold tăng dần
    const thresholds = [10, 50, 100, 150, 200, 220, 240, 250];
    let lastSize = currentMetadata.width * currentMetadata.height;
    let iterations = 0;
    const maxIterations = 5; // Giới hạn số lần trim
    
    console.log('🔍 Đang trim nhiều lần...');
    
    for (const threshold of thresholds) {
      if (iterations >= maxIterations) break;
      
      try {
        const trimmed = await sharp(currentBuffer)
          .trim({
            threshold: threshold,
            lineArt: false,
          })
          .toBuffer();
        
        const trimmedMetadata = await sharp(trimmed).metadata();
        const newSize = trimmedMetadata.width * trimmedMetadata.height;
        
        // Nếu kích thước giảm đáng kể, tiếp tục
        if (newSize < lastSize * 0.99) { // Giảm ít nhất 1%
          currentBuffer = trimmed;
          currentMetadata = trimmedMetadata;
          lastSize = newSize;
          iterations++;
          const reduction = ((1 - newSize / (currentMetadata.width * currentMetadata.height)) * 100).toFixed(1);
          console.log(`   ✓ Lần ${iterations} (threshold ${threshold}): ${trimmedMetadata.width}x${trimmedMetadata.height} (giảm ${reduction}%)`);
        }
      } catch (e) {
        // Bỏ qua nếu lỗi
      }
    }
    
    console.log(`\n✂️  Kích thước sau khi trim ${iterations} lần: ${currentMetadata.width}x${currentMetadata.height}`);
    
    // Trim một lần nữa với threshold cực cao để loại bỏ phần trắng còn lại
    try {
      const finalTrim = await sharp(currentBuffer)
        .trim({
          threshold: 250,
          lineArt: false,
        })
        .toBuffer();
      
      const finalTrimMetadata = await sharp(finalTrim).metadata();
      if (finalTrimMetadata.width * finalTrimMetadata.height < lastSize) {
        currentBuffer = finalTrim;
        currentMetadata = finalTrimMetadata;
        console.log(`   ✓ Trim cuối cùng: ${finalTrimMetadata.width}x${finalTrimMetadata.height}`);
      }
    } catch (e) {
      // Bỏ qua nếu không trim được thêm
    }
    
    // Chuyển về JPEG với chất lượng cao
    const finalImage = await sharp(currentBuffer)
      .jpeg({ 
        quality: 98,
        mozjpeg: true
      })
      .toBuffer();
    
    // Lưu file
    await sharp(finalImage).toFile(outputPath);
    
    const originalMetadata = await sharp(inputPath).metadata();
    const finalMetadata = await sharp(finalImage).metadata();
    console.log(`\n📐 Kích thước cuối cùng: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📊 Tổng giảm: từ ${originalMetadata.width}x${originalMetadata.height} xuống ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`   (Giảm ${((1 - (finalMetadata.width * finalMetadata.height) / (originalMetadata.width * originalMetadata.height)) * 100).toFixed(1)}% diện tích)`);
    console.log(`💾 Backup được lưu tại: Zyea-backup-multi.jpg`);
    console.log(`\n💡 Logo đã được cắt sát, không còn phần trắng thừa!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoMultiTrim().catch(console.error);

