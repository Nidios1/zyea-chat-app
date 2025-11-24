/**
 * Script xử lý logo: Sử dụng mask để loại bỏ nền trắng
 * Tạo alpha channel và loại bỏ phần trắng
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processLogoWithMask() {
  console.log('🎨 Đang xử lý logo - sử dụng mask để loại bỏ nền trắng...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'logo.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup-mask.jpg');

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
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup-mask.jpg`);
    }

    // Đọc raw pixel data
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    console.log(`🔍 Đang phân tích và tạo mask...`);

    // Tạo mask: loại bỏ pixel trắng (set alpha = 0)
    const whiteThreshold = 245; // Ngưỡng để coi là màu trắng
    const newData = Buffer.from(data);
    
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let hasContent = false;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Kiểm tra nếu là màu trắng (cả 3 kênh đều cao và gần bằng nhau)
        const avgColor = (r + g + b) / 3;
        const isWhite = r > whiteThreshold && g > whiteThreshold && b > whiteThreshold && 
                       Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && Math.abs(r - b) < 5;
        
        if (isWhite) {
          // Set alpha = 0 cho pixel trắng
          newData[idx + 3] = 0;
        } else {
          // Giữ nguyên alpha = 255 cho pixel không phải trắng
          newData[idx + 3] = 255;
          hasContent = true;
          
          // Cập nhật ranh giới
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    if (!hasContent) {
      console.error('❌ Không tìm thấy nội dung trong ảnh!');
      return;
    }
    
    // Thêm padding nhỏ
    const padding = 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);
    
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log(`   📍 Ranh giới nội dung: x=${minX}, y=${minY}, w=${cropWidth}, h=${cropHeight}`);
    
    // Tạo ảnh mới với alpha channel
    const imageWithAlpha = await sharp(newData, {
      raw: {
        width: width,
        height: height,
        channels: 4
      }
    })
      .png()
      .toBuffer();
    
    // Cắt theo ranh giới và chuyển về JPEG với nền trắng
    const cropped = await sharp(imageWithAlpha)
      .extract({
        left: minX,
        top: minY,
        width: cropWidth,
        height: cropHeight
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Nền trắng cho phần trong suốt
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
    console.log(`💾 Backup được lưu tại: Zyea-backup-mask.jpg`);
    console.log(`\n💡 Logo đã được cắt sát, loại bỏ nền trắng!`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  }
}

processLogoWithMask().catch(console.error);

