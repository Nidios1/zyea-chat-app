/**
 * Script xử lý logo PERFECT: Cắt sát phần màu xanh, loại bỏ HOÀN TOÀN phần trắng
 * Đảm bảo khi hiển thị không có viền trắng
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoPerfect() {
  console.log('🎨 Đang xử lý logo PERFECT - cắt sát phần màu xanh, loại bỏ HOÀN TOÀN phần trắng...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-perfect.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-perfect.jpg`);
    }

    // Phân tích pixel để tìm ranh giới màu xanh chính xác
    console.log('🔍 Đang phân tích pixel để tìm ranh giới màu xanh...');
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    // Tìm pixel màu xanh đầu tiên và cuối cùng ở mỗi cạnh
    // Màu xanh: B > R và B > G đáng kể
    let minX = width, maxX = -1, minY = height, maxY = -1;
    const blueThreshold = 40; // Chênh lệch tối thiểu giữa B và R/G để coi là màu xanh
    const minBlueValue = 50; // Giá trị B tối thiểu
    
    console.log('   🔍 Quét từng cạnh để tìm pixel màu xanh...');
    
    // Quét từ trên xuống (tìm minY)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Kiểm tra nếu là màu xanh (B cao hơn R và G đáng kể)
        const isBlue = b > minBlueValue && 
                      b > r + blueThreshold && 
                      b > g + blueThreshold;
        
        if (isBlue) {
          if (y < minY) minY = y;
          break; // Tìm thấy pixel xanh đầu tiên ở hàng này
        }
      }
    }
    
    // Quét từ dưới lên (tìm maxY)
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isBlue = b > minBlueValue && 
                      b > r + blueThreshold && 
                      b > g + blueThreshold;
        
        if (isBlue) {
          if (y > maxY) maxY = y;
          break;
        }
      }
    }
    
    // Quét từ trái sang (tìm minX)
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isBlue = b > minBlueValue && 
                      b > r + blueThreshold && 
                      b > g + blueThreshold;
        
        if (isBlue) {
          if (x < minX) minX = x;
          break;
        }
      }
    }
    
    // Quét từ phải sang (tìm maxX)
    for (let x = width - 1; x >= 0; x--) {
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        const isBlue = b > minBlueValue && 
                      b > r + blueThreshold && 
                      b > g + blueThreshold;
        
        if (isBlue) {
          if (x > maxX) maxX = x;
          break;
        }
      }
    }
    
    // Kiểm tra kết quả
    if (minX >= width || maxX < 0 || minY >= height || maxY < 0) {
      console.log('   ⚠️  Không tìm thấy ranh giới màu xanh, dùng trim');
      // Fallback: dùng trim với threshold cao
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
    
    console.log(`   ✓ Ranh giới màu xanh: x=${minX}, y=${minY}, w=${cropWidth}, h=${cropHeight}`);
    console.log(`   📊 Loại bỏ: ${width - cropWidth}px chiều rộng, ${height - cropHeight}px chiều cao`);
    
    // Cắt theo ranh giới màu xanh (KHÔNG thêm padding)
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
    
    // Kiểm tra lại xem còn phần trắng không bằng cách trim thêm một lần nữa
    console.log('🔍 Đang kiểm tra và trim lần cuối để loại bỏ phần trắng còn lại...');
    const finalTrimmed = await sharp(cropped)
      .ensureAlpha()
      .png()
      .trim({ threshold: 250, lineArt: false })
      .jpeg({ quality: 98, mozjpeg: true })
      .toBuffer();
    
    // Lưu file
    await sharp(finalTrimmed).toFile(outputPath);
    
    const finalMetadata = await sharp(finalTrimmed).metadata();
    console.log(`\n📐 Kích thước cuối cùng: ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`\n✅ Đã xử lý và lưu logo mới: Zyea.jpg`);
    console.log(`📊 Tổng giảm: từ ${metadata.width}x${metadata.height} xuống ${finalMetadata.width}x${finalMetadata.height}`);
    console.log(`   (Giảm ${((1 - (finalMetadata.width * finalMetadata.height) / (metadata.width * metadata.height)) * 100).toFixed(1)}% diện tích)`);
    console.log(`💾 Backup được lưu tại: Zyea-backup-perfect.jpg`);
    console.log(`\n💡 Logo đã được cắt PERFECT, chỉ giữ phần màu xanh, KHÔNG còn viền trắng!`);
    console.log(`   Khi hiển thị trên màn hình sẽ không có viền trắng xung quanh.`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoPerfect().catch(console.error);

