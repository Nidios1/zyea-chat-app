/**
 * Script xử lý logo: Loại bỏ hoàn toàn phần trắng ở các góc và viền
 * Trim từng cạnh riêng biệt để loại bỏ phần trắng
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoRemoveCorners() {
  console.log('🎨 Đang xử lý logo - loại bỏ phần trắng ở các góc và viền...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-corners.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-corners.jpg`);
    }

    // Chuyển sang PNG với alpha
    let currentBuffer = await sharp(inputPath)
      .ensureAlpha()
      .png()
      .toBuffer();

    // Trim nhiều lần với threshold tăng dần, tập trung vào loại bỏ phần trắng ở góc
    const thresholds = [200, 220, 240, 245, 248, 250, 252, 254];
    let bestResult = null;
    let bestSize = metadata.width * metadata.height;
    
    console.log('🔍 Đang trim với threshold cao để loại bỏ phần trắng ở góc...');
    
    for (const threshold of thresholds) {
      try {
        const trimmed = await sharp(currentBuffer)
          .trim({
            threshold: threshold,
            lineArt: false,
          })
          .toBuffer();
        
        const trimmedMetadata = await sharp(trimmed).metadata();
        const newSize = trimmedMetadata.width * trimmedMetadata.height;
        
        if (newSize < bestSize && newSize > 50000) {
          bestSize = newSize;
          bestResult = trimmed;
          const reduction = ((1 - newSize / (metadata.width * metadata.height)) * 100).toFixed(1);
          console.log(`   ✓ Threshold ${threshold}: ${trimmedMetadata.width}x${trimmedMetadata.height} (giảm ${reduction}%)`);
        }
      } catch (e) {
        // Bỏ qua nếu lỗi
      }
    }
    
    if (!bestResult) {
      console.log('   ⚠️  Dùng kết quả trim mặc định');
      bestResult = await sharp(currentBuffer)
        .trim({ threshold: 250 })
        .toBuffer();
    }
    
    // Trim thêm một lần nữa với threshold cực cao để loại bỏ phần trắng còn lại ở góc
    console.log('🔍 Đang trim lần cuối với threshold cực cao...');
    let finalResult = bestResult;
    
    for (let i = 0; i < 3; i++) {
      try {
        const reTrimmed = await sharp(finalResult)
          .trim({
            threshold: 254, // Threshold cực cao
            lineArt: false,
          })
          .toBuffer();
        
        const reTrimmedMetadata = await sharp(reTrimmed).metadata();
        const currentMetadata = await sharp(finalResult).metadata();
        
        // Nếu kích thước giảm, tiếp tục
        if (reTrimmedMetadata.width * reTrimmedMetadata.height < currentMetadata.width * currentMetadata.height) {
          finalResult = reTrimmed;
          console.log(`   ✓ Trim lần ${i + 1}: ${reTrimmedMetadata.width}x${reTrimmedMetadata.height}`);
        } else {
          break; // Không còn giảm được nữa
        }
      } catch (e) {
        break;
      }
    }
    
    // Phân tích pixel để loại bỏ phần trắng ở viền
    console.log('🔍 Đang phân tích pixel để loại bỏ phần trắng ở viền...');
    const { data, info } = await sharp(finalResult)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Tìm ranh giới thực sự của nội dung (không phải trắng)
    let minX = width, maxX = 0, minY = height, maxY = 0;
    const whiteThreshold = 240;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Kiểm tra nếu KHÔNG phải màu trắng
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold && 
                       Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
        
        if (!isWhite) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    // Cắt theo ranh giới đã tìm (không thêm padding)
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    if (cropWidth < width || cropHeight < height) {
      console.log(`   📍 Cắt thêm: từ ${width}x${height} xuống ${cropWidth}x${cropHeight}`);
      finalResult = await sharp(finalResult)
        .extract({
          left: minX,
          top: minY,
          width: cropWidth,
          height: cropHeight
        })
        .toBuffer();
    }
    
    const finalMetadata = await sharp(finalResult).metadata();
    console.log(`\n✂️  Kích thước sau khi xử lý: ${finalMetadata.width}x${finalMetadata.height}`);
    
    // Chuyển về JPEG với chất lượng cao
    const finalImage = await sharp(finalResult)
      .jpeg({ 
        quality: 98,
        mozjpeg: true
      })
      .toBuffer();
    
    // Lưu file
    await sharp(finalImage).toFile(outputPath);
    
    const savedMetadata = await sharp(finalImage).metadata();
    console.log(`📐 Kích thước cuối cùng: ${savedMetadata.width}x${savedMetadata.height}`);
    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📊 Tổng giảm: từ ${metadata.width}x${metadata.height} xuống ${savedMetadata.width}x${savedMetadata.height}`);
    console.log(`   (Giảm ${((1 - (savedMetadata.width * savedMetadata.height) / (metadata.width * metadata.height)) * 100).toFixed(1)}% diện tích)`);
    console.log(`💾 Backup được lưu tại: Zyea-backup-corners.jpg`);
    console.log(`\n💡 Logo đã được cắt sát, loại bỏ phần trắng ở các góc và viền!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoRemoveCorners().catch(console.error);

