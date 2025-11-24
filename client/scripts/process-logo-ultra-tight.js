/**
 * Script xử lý logo: cắt cực kỳ sát logo bằng cách phát hiện màu xanh
 * Loại bỏ hoàn toàn phần trắng xung quanh
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoUltraTight() {
  console.log('🎨 Đang xử lý logo - cắt cực kỳ sát bằng cách phát hiện màu xanh...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup4.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup4.jpg`);
    }

    // Đọc raw pixel data để phát hiện ranh giới màu xanh
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    console.log(`🔍 Đang phân tích pixel để tìm ranh giới màu xanh...`);

    // Tìm ranh giới: tìm pixel đầu tiên và cuối cùng không phải màu trắng
    let minX = width, maxX = 0, minY = height, maxY = 0;
    const whiteThreshold = 240; // Pixel có giá trị > 240 trên mỗi kênh RGB được coi là trắng
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Kiểm tra nếu KHÔNG phải màu trắng
        // Màu trắng: cả 3 kênh đều cao và gần bằng nhau
        const avgColor = (r + g + b) / 3;
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold && 
                       Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10;
        
        // Màu xanh: B cao hơn R và G đáng kể
        const isBlue = b > r + 20 && b > g + 20 && b > 80;
        
        // Màu trắng trong logo (icon trắng): R, G, B đều cao nhưng không phải nền trắng
        const isWhiteIcon = avgColor > 200 && !isWhite;
        
        // Nếu không phải nền trắng, thì là phần của logo
        if (!isWhite || isBlue || isWhiteIcon) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Thêm padding nhỏ (1-2 pixel) để tránh cắt quá sát
    const padding = 1;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log(`   📍 Tìm thấy ranh giới: x=${minX}, y=${minY}, w=${cropWidth}, h=${cropHeight}`);
    
    // Cắt ảnh theo ranh giới đã tìm
    const cropped = await sharp(inputPath)
      .extract({
        left: minX,
        top: minY,
        width: cropWidth,
        height: cropHeight
      })
      .jpeg({ 
        quality: 98,
        mozjpeg: true
      })
      .toBuffer();
    
    // Lưu file
    await sharp(cropped).toFile(outputPath);
    
    const finalMetadata = await sharp(cropped).metadata();
    console.log(`\n📐 Kích thước cuối cùng: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📊 Tổng giảm: từ ${metadata.width}x${metadata.height} xuống ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`   (Giảm ${((1 - (finalMetadata.width * finalMetadata.height) / (metadata.width * metadata.height)) * 100).toFixed(1)}% diện tích)`);
    console.log(`💾 Backup được lưu tại: Zyea-backup4.jpg`);
    console.log(`\n💡 Logo đã được cắt cực kỳ sát, không còn phần trắng thừa!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoUltraTight().catch(console.error);

