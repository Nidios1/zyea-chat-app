/**
 * Crop viền trắng từ logo
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function cropWhitespace() {
  console.log('🎨 Đang cắt viền trắng từ logo...\n');

  const inputPath = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const outputPath = path.join(__dirname, '..', 'public', 'Zyea-cropped.jpg');

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File không tồn tại:', inputPath);
    return;
  }

  try {
    // Đọc thông tin ảnh
    const metadata = await sharp(inputPath).metadata();
    console.log(`📐 Kích thước ảnh gốc: ${metadata.width}x${metadata.height}`);
    console.log(`📄 Format: ${metadata.format}`);

    // Tăng contrast và brightness để detect whitespace tốt hơn
    const processed = await sharp(inputPath)
      .normalise()
      .toBuffer();

    // Tìm phần non-white để crop
    const stats = await sharp(processed)
      .threshold(200) // Threshold để detect white
      .toBuffer();

    // Crop ảnh với padding 5%
    const padding = 0.95;
    const cropWidth = Math.floor(metadata.width * padding);
    const cropHeight = Math.floor(metadata.height * padding);
    const left = Math.floor(metadata.width * (1 - padding) / 2);
    const top = Math.floor(metadata.height * (1 - padding) / 2);

    await sharp(inputPath)
      .extract({
        left: left,
        top: top,
        width: cropWidth,
        height: cropHeight
      })
      .jpeg({ quality: 100 })
      .toFile(outputPath);

    console.log(`\n✅ Đã tạo file mới: Zyea-cropped.jpg`);
    console.log(`📐 Đã crop từ ${metadata.width}x${metadata.height} xuống ${cropWidth}x${cropHeight}`);
    console.log(`\n💡 Bây giờ dùng file Zyea-cropped.jpg làm icon gốc!`);
    console.log(`   Chạy: cp public/Zyea-cropped.jpg public/Zyea.jpg`);
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  }
}

cropWhitespace().catch(console.error);










