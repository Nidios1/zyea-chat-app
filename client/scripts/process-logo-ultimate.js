/**
 * Script xử lý logo ULTIMATE: Loại bỏ HOÀN TOÀN phần trắng
 * Tìm pixel KHÔNG phải trắng (bao gồm cả anti-aliasing)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoUltimate() {
  console.log('🎨 Đang xử lý logo ULTIMATE - loại bỏ HOÀN TOÀN phần trắng...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-ultimate.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-ultimate.jpg`);
    }

    // Phân tích pixel để tìm ranh giới
    console.log('🔍 Đang phân tích pixel để tìm ranh giới...');
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Tìm pixel KHÔNG phải trắng (ngưỡng thấp để bắt cả anti-aliasing)
    let minX = width, maxX = -1, minY = height, maxY = -1;
    const whiteThreshold = 200; // Ngưỡng thấp hơn để bắt cả pixel gần trắng
    
    // Quét toàn bộ ảnh để tìm ranh giới
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Kiểm tra nếu KHÔNG phải màu trắng hoặc gần trắng
        // Màu trắng: cả 3 kênh đều cao và gần bằng nhau
        const avgColor = (r + g + b) / 3;
        const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        
        // Không phải trắng nếu:
        // 1. Có ít nhất 1 kênh < threshold, HOẶC
        // 2. Có sự khác biệt màu đáng kể (không phải xám/trắng), HOẶC
        // 3. Màu xanh (B cao hơn R và G đáng kể)
        const isWhite = avgColor > whiteThreshold && colorDiff < 15;
        const isBlue = b > r + 30 && b > g + 30 && b > 60;
        const isNotWhite = !isWhite || isBlue || avgColor < whiteThreshold - 20;
        
        if (isNotWhite) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Đảm bảo tìm thấy ranh giới hợp lý
    if (minX >= width || maxX < 0 || minY >= height || maxY < 0) {
      console.log('   ⚠️  Không tìm thấy ranh giới, dùng trim');
      // Fallback: dùng trim
      const trimmed = await sharp(inputPath)
        .trim({ threshold: 250 })
        .jpeg({ quality: 98, mozjpeg: true })
        .toFile(outputPath);
      
      const finalMeta = await sharp(outputPath).metadata();
      console.log(`\n📐 Kích thước cuối cùng: ${finalMeta.width}x${finalMeta.height}`);
      return;
    }
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log(`   📍 Ranh giới tìm được: x=${minX}, y=${minY}, w=${cropWidth}, h=${cropHeight}`);
    console.log(`   📊 Giảm: ${width - cropWidth}px chiều rộng, ${height - cropHeight}px chiều cao`);
    
    // Cắt theo ranh giới (KHÔNG thêm padding)
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
    console.log(`💾 Backup được lưu tại: Zyea-backup-ultimate.jpg`);
    console.log(`\n💡 Logo đã được cắt ULTIMATE, loại bỏ HOÀN TOÀN phần trắng!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoUltimate().catch(console.error);

