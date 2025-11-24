/**
 * Script xử lý logo: Loại bỏ HOÀN TOÀN phần trắng - PHIÊN BẢN MẠNH NHẤT
 * Trim nhiều lần với threshold cực cao và phân tích pixel chính xác
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoNoWhite() {
  console.log('🎨 Đang xử lý logo - loại bỏ HOÀN TOÀN phần trắng (PHIÊN BẢN MẠNH NHẤT)...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-no-white.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-no-white.jpg`);
    }

    // Bước 1: Trim với threshold cực cao nhiều lần
    console.log('🔍 Bước 1: Trim nhiều lần với threshold cực cao...');
    let currentBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();
    
    let lastSize = metadata.width * metadata.height;
    const thresholds = [250, 252, 253, 254, 254, 254]; // Trim nhiều lần với threshold cực cao
    
    for (let i = 0; i < thresholds.length; i++) {
      try {
        const trimmed = await sharp(currentBuffer)
          .trim({
            threshold: thresholds[i],
            lineArt: false,
          })
          .toBuffer();
        
        const trimmedMeta = await sharp(trimmed).metadata();
        const newSize = trimmedMeta.width * trimmedMeta.height;
        
        if (newSize < lastSize && newSize > 50000) {
          currentBuffer = trimmed;
          lastSize = newSize;
          console.log(`   ✓ Trim lần ${i + 1} (threshold ${thresholds[i]}): ${trimmedMeta.width}x${trimmedMeta.height}`);
        } else {
          break; // Không còn giảm được nữa
        }
      } catch (e) {
        break;
      }
    }
    
    // Bước 2: Phân tích pixel để tìm ranh giới chính xác
    console.log('🔍 Bước 2: Phân tích pixel để tìm ranh giới chính xác...');
    const { data, info } = await sharp(currentBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Tìm pixel KHÔNG phải trắng (bao gồm cả màu xanh và icon trắng)
    let minX = width, maxX = -1, minY = height, maxY = -1;
    const whiteThreshold = 180; // Ngưỡng thấp để bắt cả pixel gần trắng
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const avgColor = (r + g + b) / 3;
        const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        
        // Không phải trắng nếu:
        // 1. Có màu xanh (B cao hơn R và G đáng kể), HOẶC
        // 2. Có sự khác biệt màu đáng kể, HOẶC
        // 3. Trung bình màu thấp hơn threshold
        const isBlue = b > r + 30 && b > g + 30 && b > 50;
        const hasColorDiff = colorDiff > 20;
        const isNotWhite = avgColor < whiteThreshold || isBlue || hasColorDiff;
        
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
      console.log('   ⚠️  Không tìm thấy ranh giới, dùng kết quả trim');
      minX = 0;
      minY = 0;
      maxX = width - 1;
      maxY = height - 1;
    }
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log(`   ✓ Ranh giới: x=${minX}, y=${minY}, w=${cropWidth}, h=${cropHeight}`);
    
    // Cắt theo ranh giới
    let finalBuffer = await sharp(currentBuffer)
      .extract({
        left: minX,
        top: minY,
        width: cropWidth,
        height: cropHeight
      })
      .toBuffer();
    
    // Bước 3: Trim thêm một lần nữa với threshold cực cao
    console.log('🔍 Bước 3: Trim lần cuối với threshold cực cao...');
    try {
      const finalTrimmed = await sharp(finalBuffer)
        .trim({ threshold: 254, lineArt: false })
        .toBuffer();
      
      const finalTrimMeta = await sharp(finalTrimmed).metadata();
      const currentMeta = await sharp(finalBuffer).metadata();
      
      if (finalTrimMeta.width * finalTrimMeta.height < currentMeta.width * currentMeta.height) {
        finalBuffer = finalTrimmed;
        console.log(`   ✓ Trim thêm: ${finalTrimMeta.width}x${finalTrimMeta.height}`);
      }
    } catch (e) {
      // Bỏ qua nếu không trim được
    }
    
    // Chuyển về JPEG với chất lượng cao
    const finalImage = await sharp(finalBuffer)
      .jpeg({ 
        quality: 98,
        mozjpeg: true
      })
      .toBuffer();
    
    // Lưu file
    await sharp(finalImage).toFile(outputPath);
    
    const finalMetadata = await sharp(finalImage).metadata();
    console.log(`\n📐 Kích thước cuối cùng: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📊 Tổng giảm: từ ${metadata.width}x${metadata.height} xuống ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`   (Giảm ${((1 - (finalMetadata.width * finalMetadata.height) / (metadata.width * metadata.height)) * 100).toFixed(1)}% diện tích)`);
    console.log(`💾 Backup được lưu tại: Zyea-backup-no-white.jpg`);
    console.log(`\n💡 Logo đã được cắt HOÀN TOÀN, KHÔNG còn viền trắng!`);
    console.log(`   Khi hiển thị trên màn hình sẽ KHÔNG có viền trắng xung quanh.`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoNoWhite().catch(console.error);

