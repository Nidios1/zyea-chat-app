/**
 * Script xử lý Zyea.jpg: Loại bỏ viền trắng ở 4 góc bằng cách phân tích từng góc
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function removeWhiteCorners() {
  console.log('🎨 Đang xử lý Zyea.jpg để loại bỏ viền trắng ở 4 góc...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const backupPath = path.join(__dirname, '..', 'public', 'Zyea-backup.jpg');

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File Zyea.jpg không tồn tại:', inputPath);
    return;
  }

  try {
    // Backup file gốc
    if (fs.existsSync(outputPath)) {
      fs.copyFileSync(outputPath, backupPath);
      console.log(`💾 Đã backup Zyea.jpg -> Zyea-backup.jpg`);
    }

    // Đọc metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Kích thước ảnh gốc: ${metadata.width}x${metadata.height}`);

    // Đọc raw pixel data
    const { data, info } = await sharp(inputPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    console.log('🔍 Đang phân tích pixel để tìm và loại bỏ viền trắng ở 4 góc...');
    
    // Hàm kiểm tra pixel có phải màu trắng/trắng nhạt không
    const isWhitePixel = (r, g, b, threshold = 200) => {
      const avg = (r + g + b) / 3;
      const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      // Màu trắng: trung bình cao và ít khác biệt giữa các kênh
      return avg > threshold && colorDiff < 30;
    };
    
    // Tạo buffer mới với alpha channel
    const newData = Buffer.from(data);
    
    // Phân tích và loại bỏ viền trắng ở 4 góc
    // Kiểm tra từng góc với bán kính lớn hơn
    const cornerRadius = Math.min(width, height) * 0.15; // 15% của cạnh nhỏ hơn
    
    let pixelsChanged = 0;
    
    // Góc trên trái
    for (let y = 0; y < cornerRadius; y++) {
      for (let x = 0; x < cornerRadius; x++) {
        const distance = Math.sqrt(x * x + y * y);
        if (distance < cornerRadius) {
          const idx = (y * width + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (isWhitePixel(r, g, b, 180)) {
            // Đặt alpha = 0 (trong suốt)
            if (channels === 4) {
              newData[idx + 3] = 0;
            }
            pixelsChanged++;
          }
        }
      }
    }
    
    // Góc trên phải
    for (let y = 0; y < cornerRadius; y++) {
      for (let x = width - cornerRadius; x < width; x++) {
        const distance = Math.sqrt((width - 1 - x) * (width - 1 - x) + y * y);
        if (distance < cornerRadius) {
          const idx = (y * width + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (isWhitePixel(r, g, b, 180)) {
            if (channels === 4) {
              newData[idx + 3] = 0;
            }
            pixelsChanged++;
          }
        }
      }
    }
    
    // Góc dưới trái
    for (let y = height - cornerRadius; y < height; y++) {
      for (let x = 0; x < cornerRadius; x++) {
        const distance = Math.sqrt(x * x + (height - 1 - y) * (height - 1 - y));
        if (distance < cornerRadius) {
          const idx = (y * width + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (isWhitePixel(r, g, b, 180)) {
            if (channels === 4) {
              newData[idx + 3] = 0;
            }
            pixelsChanged++;
          }
        }
      }
    }
    
    // Góc dưới phải
    for (let y = height - cornerRadius; y < height; y++) {
      for (let x = width - cornerRadius; x < width; x++) {
        const distance = Math.sqrt((width - 1 - x) * (width - 1 - x) + (height - 1 - y) * (height - 1 - y));
        if (distance < cornerRadius) {
          const idx = (y * width + x) * channels;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          if (isWhitePixel(r, g, b, 180)) {
            if (channels === 4) {
              newData[idx + 3] = 0;
            }
            pixelsChanged++;
          }
        }
      }
    }
    
    console.log(`   ✓ Đã xử lý ${pixelsChanged} pixel trắng ở 4 góc`);
    
    if (pixelsChanged > 0) {
      // Tạo ảnh mới với alpha channel
      const processedImage = await sharp(newData, {
        raw: {
          width: width,
          height: height,
          channels: channels
        }
      })
      .png({ quality: 100 })
      .toBuffer();
      
      // Chuyển về JPEG (không có alpha, nền trong suốt sẽ thành đen hoặc trắng)
      // Hoặc giữ PNG nếu muốn giữ alpha
      // Vì JPEG không hỗ trợ alpha, ta sẽ composite lên nền trong suốt
      await sharp({
        create: {
          width: width,
          height: height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Nền trong suốt
        }
      })
      .composite([{ input: processedImage }])
      .png()
      .toFile(outputPath.replace('.jpg', '-temp.png'));
      
      // Ghi vào file tạm trước
      const tempPath = outputPath.replace('.jpg', '-new.jpg');
      
      // Chuyển PNG về JPEG với nền đen (hoặc màu khác)
      await sharp(outputPath.replace('.jpg', '-temp.png'))
        .flatten({ background: { r: 0, g: 0, b: 0 } }) // Nền đen
        .jpeg({ quality: 98, mozjpeg: true })
        .toFile(tempPath);
      
      // Xóa file temp PNG
      if (fs.existsSync(outputPath.replace('.jpg', '-temp.png'))) {
        fs.unlinkSync(outputPath.replace('.jpg', '-temp.png'));
      }
      
      // Thay thế file gốc
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(outputPath); // Xóa file cũ
        fs.renameSync(tempPath, outputPath); // Đổi tên file mới
      }
      
      const finalMeta = await sharp(outputPath).metadata();
      console.log(`\n📐 Kích thước cuối cùng: ${finalMeta.width}x${finalMeta.height}`);
      console.log(`   ✅ Đã loại bỏ viền trắng ở 4 góc`);
    } else {
      console.log('\n⚠️  Không tìm thấy pixel trắng ở 4 góc để loại bỏ');
    }

    console.log('\n✅ Đã xử lý xong! File đã được lưu tại:', outputPath);
    console.log('💾 Backup được lưu tại:', backupPath);
    
  } catch (error) {
    console.error('❌ Lỗi khi xử lý:', error);
    throw error;
  }
}

removeWhiteCorners().catch(console.error);
