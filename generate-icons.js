const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Đường dẫn tới logo gốc
const logoPath = path.join(__dirname, 'client/public/Zyea.jpg');

// Cấu hình các icon cần tạo
const iconConfigs = [
  // Favicon
  { size: 32, output: 'client/public/favicon.png' },
  { size: 16, output: 'client/public/favicon-16x16.png' },
  
  // PWA Icons - Tất cả kích thước cho manifest.json
  { size: 72, output: 'client/public/icon-72x72.png' },
  { size: 96, output: 'client/public/icon-96x96.png' },
  { size: 128, output: 'client/public/icon-128x128.png' },
  { size: 144, output: 'client/public/icon-144x144.png' },
  { size: 152, output: 'client/public/icon-152x152.png' },
  { size: 192, output: 'client/public/icon-192x192.png' },
  { size: 384, output: 'client/public/icon-384x384.png' },
  { size: 512, output: 'client/public/icon-512x512.png' },
  
  // iOS Icons
  { size: 180, output: 'client/public/apple-touch-icon.png' },
  
  // Capacitor Icons
  { size: 1024, output: 'client/resources/icon.png' },
  
  // Splash Screen (larger size)
  { size: 2732, output: 'client/resources/splash.png' },
  
  // Build folder - Copy tất cả icon vào build
  { size: 72, output: 'client/build/icon-72x72.png' },
  { size: 96, output: 'client/build/icon-96x96.png' },
  { size: 128, output: 'client/build/icon-128x128.png' },
  { size: 144, output: 'client/build/icon-144x144.png' },
  { size: 152, output: 'client/build/icon-152x152.png' },
  { size: 192, output: 'client/build/icon-192x192.png' },
  { size: 384, output: 'client/build/icon-384x384.png' },
  { size: 512, output: 'client/build/icon-512x512.png' }
];

async function generateIcons() {
  console.log('🎨 Bắt đầu tạo icons từ logo gốc...\n');
  
  // Kiểm tra logo gốc có tồn tại không
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Không tìm thấy logo gốc tại:', logoPath);
    return;
  }
  
  // Tạo thư mục nếu chưa có
  const dirs = ['client/public', 'client/resources', 'client/build'];
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log('✅ Đã tạo thư mục:', dir);
    }
  });
  
  console.log('📸 Logo gốc:', logoPath);
  console.log('🔄 Đang tạo', iconConfigs.length, 'icons...\n');
  
  // Tạo từng icon
  for (const config of iconConfigs) {
    try {
      const outputPath = path.join(__dirname, config.output);
      
      await sharp(logoPath)
        .resize(config.size, config.size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ ${config.size}x${config.size} → ${config.output}`);
    } catch (error) {
      console.error(`❌ Lỗi khi tạo ${config.output}:`, error.message);
    }
  }
  
  console.log('\n✨ Hoàn thành! Đã tạo tất cả các icons.');
  console.log('\n📝 Các file đã được tạo:');
  iconConfigs.forEach(config => {
    console.log(`   - ${config.output} (${config.size}x${config.size})`);
  });
}

// Chạy script
generateIcons().catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});

