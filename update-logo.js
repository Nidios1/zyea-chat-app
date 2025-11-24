/**
 * Script để cập nhật logo Zyea.png cho toàn bộ dự án
 * 
 * Usage:
 *   node update-logo.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_LOGO = path.join(__dirname, 'client/public/Zyea.png');
const MOBILE_ASSETS_DIR = path.join(__dirname, 'mobile-expo/assets');
const CLIENT_PUBLIC_DIR = path.join(__dirname, 'client/public');

// Icon sizes cần generate
const ICON_SIZES = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'favicon.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'apple-touch-icon.png', size: 180 },
];

async function main() {
  console.log('🔄 Đang cập nhật logo cho toàn bộ dự án...\n');

  // Kiểm tra file nguồn
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('❌ Không tìm thấy file:', SOURCE_LOGO);
    process.exit(1);
  }

  // Kiểm tra sharp (cần để resize images)
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('❌ Cần cài đặt sharp để resize images:');
    console.error('   npm install sharp --save-dev');
    process.exit(1);
  }

  // 1. Copy Zyea.png vào mobile-expo/assets
  console.log('📱 1. Copy logo vào mobile-expo/assets...');
  const mobileLogoPath = path.join(MOBILE_ASSETS_DIR, 'Zyea.png');
  fs.copyFileSync(SOURCE_LOGO, mobileLogoPath);
  console.log('   ✅ Đã copy:', mobileLogoPath);

  // 2. Generate icons cho client
  console.log('\n🌐 2. Generate icons cho client...');
  const sourceImage = sharp(SOURCE_LOGO);

  for (const icon of ICON_SIZES) {
    const outputPath = path.join(CLIENT_PUBLIC_DIR, icon.name);
    try {
      await sourceImage
        .clone()
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`   ✅ Đã tạo: ${icon.name} (${icon.size}x${icon.size})`);
    } catch (error) {
      console.error(`   ❌ Lỗi khi tạo ${icon.name}:`, error.message);
    }
  }

  // 3. Generate favicon cho mobile-expo
  console.log('\n📱 3. Generate favicon cho mobile-expo...');
  const mobileFaviconPath = path.join(MOBILE_ASSETS_DIR, 'favicon.png');
  try {
    await sourceImage
      .clone()
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(mobileFaviconPath);
    console.log('   ✅ Đã tạo favicon cho mobile-expo');
  } catch (error) {
    console.error('   ❌ Lỗi khi tạo favicon:', error.message);
  }

  // 4. Generate splash icon (1024x1024)
  console.log('\n📱 4. Generate splash icon...');
  const splashIconPath = path.join(MOBILE_ASSETS_DIR, 'splash-icon.png');
  try {
    await sourceImage
      .clone()
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(splashIconPath);
    console.log('   ✅ Đã tạo splash-icon.png');
  } catch (error) {
    console.error('   ❌ Lỗi khi tạo splash icon:', error.message);
  }

  // 5. Generate adaptive icon (1024x1024)
  console.log('\n📱 5. Generate adaptive icon...');
  const adaptiveIconPath = path.join(MOBILE_ASSETS_DIR, 'adaptive-icon.png');
  try {
    await sourceImage
      .clone()
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(adaptiveIconPath);
    console.log('   ✅ Đã tạo adaptive-icon.png');
  } catch (error) {
    console.error('   ❌ Lỗi khi tạo adaptive icon:', error.message);
  }

  // 6. Cập nhật app.json
  console.log('\n📝 6. Cập nhật app.json...');
  const appJsonPath = path.join(__dirname, 'mobile-expo/app.json');
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // Thay Zyea.jpg bằng Zyea.png
    if (appJson.expo.icon === './assets/Zyea.jpg') {
      appJson.expo.icon = './assets/Zyea.png';
    }
    if (appJson.expo.ios?.icon === './assets/Zyea.jpg') {
      appJson.expo.ios.icon = './assets/Zyea.png';
    }
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf8');
    console.log('   ✅ Đã cập nhật app.json');
  } catch (error) {
    console.error('   ❌ Lỗi khi cập nhật app.json:', error.message);
  }

  // 7. Cập nhật các file code
  console.log('\n📝 7. Cập nhật các file code...');

  // Tìm và thay thế trong mobile-expo/src
  const mobileSrcDir = path.join(__dirname, 'mobile-expo/src');
  function updateFilesInDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        updateFilesInDir(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
        try {
          let content = fs.readFileSync(fullPath, 'utf8');
          const originalContent = content;
          
          // Thay thế Zyea.jpg bằng Zyea.png
          content = content.replace(/Zyea\.jpg/g, 'Zyea.png');
          content = content.replace(/require\(['"]\.\.\/\.\.\/\.\.\/assets\/Zyea\.jpg['"]\)/g, "require('../../../assets/Zyea.png')");
          content = content.replace(/require\(['"]\.\.\/\.\.\/assets\/Zyea\.jpg['"]\)/g, "require('../../assets/Zyea.png')");
          content = content.replace(/require\(['"]\.\/assets\/Zyea\.jpg['"]\)/g, "require('./assets/Zyea.png')");
          
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`   ✅ Đã cập nhật: ${path.relative(__dirname, fullPath)}`);
          }
        } catch (error) {
          // Bỏ qua lỗi đọc file
        }
      }
    }
  }

  updateFilesInDir(mobileSrcDir);

  console.log('\n✅ Hoàn thành! Logo đã được cập nhật cho toàn bộ dự án.');
  console.log('\n📋 Các bước tiếp theo:');
  console.log('   1. Kiểm tra lại các file đã được cập nhật');
  console.log('   2. Test app để đảm bảo logo hiển thị đúng');
  console.log('   3. Nếu cần, chạy lại build để generate icons mới');
}

main().catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});
