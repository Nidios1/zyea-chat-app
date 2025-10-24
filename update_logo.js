/**
 * Script tự động cập nhật tất cả logo/icon từ file Zyea.jpg
 * Chạy: node update_logo.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Đường dẫn
const sourceImage = path.join(__dirname, 'client', 'public', 'Zyea.jpg');
const publicDir = path.join(__dirname, 'client', 'public');
const resourcesDir = path.join(__dirname, 'client', 'resources');
const buildDir = path.join(__dirname, 'client', 'build');

// Kiểm tra file nguồn
if (!fs.existsSync(sourceImage)) {
  console.error('❌ Không tìm thấy file Zyea.jpg tại:', sourceImage);
  process.exit(1);
}

console.log('🎨 Bắt đầu cập nhật logo từ:', sourceImage);
console.log('');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

// Danh sách các icon cần tạo
const iconSizes = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 32 },
];

// Hàm tạo icon
async function generateIcons() {
  try {
    console.log('📱 Đang tạo các icon PWA...');
    
    // Tạo các icon cho public/
    for (const icon of iconSizes) {
      const outputPath = path.join(publicDir, icon.name);
      await sharp(sourceImage)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 100 })
        .toFile(outputPath);
      console.log(`  ✅ Tạo ${icon.name} (${icon.size}x${icon.size})`);
    }

    // Tạo app.jpg (512x512)
    console.log('');
    console.log('📷 Đang tạo app.jpg...');
    const appJpgPath = path.join(publicDir, 'app.jpg');
    await sharp(sourceImage)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toFile(appJpgPath);
    console.log('  ✅ Tạo app.jpg (512x512)');

    // Tạo icon cho resources/ (Capacitor)
    console.log('');
    console.log('📱 Đang tạo icon cho Capacitor...');
    const resourceIconPath = path.join(resourcesDir, 'icon.png');
    await sharp(sourceImage)
      .resize(1024, 1024, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 100 })
      .toFile(resourceIconPath);
    console.log('  ✅ Tạo resources/icon.png (1024x1024)');

    // Tạo splash screen (nếu cần)
    console.log('');
    console.log('🎆 Đang tạo splash screen...');
    const splashPath = path.join(resourcesDir, 'splash.png');
    await sharp(sourceImage)
      .resize(2732, 2732, {
        fit: 'contain',
        background: { r: 0, g: 132, b: 255, alpha: 1 } // màu #0084ff
      })
      .png({ quality: 100 })
      .toFile(splashPath);
    console.log('  ✅ Tạo resources/splash.png (2732x2732)');

    // Copy sang thư mục build nếu tồn tại
    if (fs.existsSync(buildDir)) {
      console.log('');
      console.log('📦 Đang cập nhật build/...');
      
      // Copy Zyea.jpg
      fs.copyFileSync(sourceImage, path.join(buildDir, 'Zyea.jpg'));
      console.log('  ✅ Copy Zyea.jpg vào build/');
      
      // Copy app.jpg
      fs.copyFileSync(appJpgPath, path.join(buildDir, 'app.jpg'));
      console.log('  ✅ Copy app.jpg vào build/');
    }

    console.log('');
    console.log('✅ HOÀN TẤT! Tất cả logo/icon đã được cập nhật.');
    console.log('');
    console.log('📝 Các file đã cập nhật:');
    console.log('   • client/public/Zyea.jpg (nguồn gốc)');
    console.log('   • client/public/app.jpg');
    console.log('   • client/public/icon-*.png (tất cả các kích thước)');
    console.log('   • client/public/apple-touch-icon.png');
    console.log('   • client/public/favicon.png');
    console.log('   • client/resources/icon.png');
    console.log('   • client/resources/splash.png');
    if (fs.existsSync(buildDir)) {
      console.log('   • client/build/Zyea.jpg');
      console.log('   • client/build/app.jpg');
    }
    console.log('');
    console.log('💡 Tiếp theo:');
    console.log('   1. Build lại ứng dụng: cd client && npm run build');
    console.log('   2. Hoặc chạy dev server: cd client && npm start');
    console.log('');

  } catch (error) {
    console.error('❌ Lỗi khi tạo icon:', error.message);
    process.exit(1);
  }
}

// Chạy script
generateIcons();

