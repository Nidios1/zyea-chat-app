/**
 * Script xử lý logo: Loại bỏ AGGRESSIVE phần trắng ở các góc
 * Tìm pixel màu xanh đầu tiên/cuối cùng ở mỗi cạnh
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoAggressive() {
  console.log('🎨 Đang xử lý logo - loại bỏ AGGRESSIVE phần trắng ở các góc...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-aggressive.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-aggressive.jpg`);
    }

    // Trim trước với threshold cao
    console.log('🔍 Bước 1: Trim với threshold cao...');
    let trimmed = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .trim({ threshold: 250, lineArt: false })
      .toBuffer();
    
    const trimmedMeta = await sharp(trimmed).metadata();
    console.log(`   ✓ Sau trim: ${trimmedMeta.width}x${trimmedMeta.height}`);

    // Phân tích pixel để tìm ranh giới màu xanh
    console.log('🔍 Bước 2: Phân tích pixel để tìm ranh giới màu xanh...');
    const { data, info } = await sharp(trimmed)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Tìm pixel màu xanh đầu tiên và cuối cùng ở mỗi cạnh
    let minX = width, maxX = -1, minY = height, maxY = -1;
    const blueThreshold = 50; // Ngưỡng để coi là màu xanh (B > R và B > G)
    const whiteThreshold = 230; // Ngưỡng để coi là màu trắng
    
    // Quét từ trên xuống để tìm minY
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;
        const isBlue = b > r + blueThreshold && b > g + blueThreshold && b > 80;
        const isWhiteIcon = (r + g + b) / 3 > 200 && !isWhite; // Icon trắng trong logo
        
        if (!isWhite && (isBlue || isWhiteIcon)) {
          if (y < minY) minY = y;
          break; // Tìm thấy pixel đầu tiên ở hàng này
        }
      }
    }
    
    // Quét từ dưới lên để tìm maxY
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;
        const isBlue = b > r + blueThreshold && b > g + blueThreshold && b > 80;
        const isWhiteIcon = (r + g + b) / 3 > 200 && !isWhite;
        
        if (!isWhite && (isBlue || isWhiteIcon)) {
          if (y > maxY) maxY = y;
          break;
        }
      }
    }
    
    // Quét từ trái sang để tìm minX
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;
        const isBlue = b > r + blueThreshold && b > g + blueThreshold && b > 80;
        const isWhiteIcon = (r + g + b) / 3 > 200 && !isWhite;
        
        if (!isWhite && (isBlue || isWhiteIcon)) {
          if (x < minX) minX = x;
          break;
        }
      }
    }
    
    // Quét từ phải sang để tìm maxX
    for (let x = width - 1; x >= 0; x--) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold;
        const isBlue = b > r + blueThreshold && b > g + blueThreshold && b > 80;
        const isWhiteIcon = (r + g + b) / 3 > 200 && !isWhite;
        
        if (!isWhite && (isBlue || isWhiteIcon)) {
          if (x > maxX) maxX = x;
          break;
        }
      }
    }
    
    // Đảm bảo tìm thấy ranh giới hợp lý
    if (minX >= width || maxX < 0 || minY >= height || maxY < 0) {
      console.log('   ⚠️  Không tìm thấy ranh giới, dùng kết quả trim');
      minX = 0;
      minY = 0;
      maxX = width - 1;
      maxY = height - 1;
    }
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log(`   📍 Ranh giới tìm được: x=${minX}, y=${minY}, w=${cropWidth}, h=${cropHeight}`);
    
    // Cắt theo ranh giới (KHÔNG thêm padding)
    const cropped = await sharp(trimmed)
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
    console.log(`💾 Backup được lưu tại: Zyea-backup-aggressive.jpg`);
    console.log(`\n💡 Logo đã được cắt AGGRESSIVE, loại bỏ hoàn toàn phần trắng ở các góc!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoAggressive().catch(console.error);

