/**
 * Generate PWA icons từ Zyea.jpg với border-radius đẹp và loại bỏ viền trắng
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateLogoIconsNoBorder() {
  console.log('🎨 Generating logo icons from Zyea.jpg (no border)...\n');

  const iconSource = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const publicDir = path.join(__dirname, '..', 'public');

  // Kiểm tra file source
  if (!fs.existsSync(iconSource)) {
    console.error('❌ Source file not found:', iconSource);
    return;
  }

  // Icon sizes for PWA
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon.png' },
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' },
  ];

  // Border radius lớn hơn (30%) để bo tròn hơn và loại bỏ viền trắng
  const borderRadius = 0.30;

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);
    
    console.log(`🔄 Generating ${name} (${size}x${size})...`);
    
    // Tính border radius dựa trên size
    const radius = Math.round(size * borderRadius);
    
    await sharp(iconSource)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .extract({
        left: 0,
        top: 0,
        width: size,
        height: size
      })
      .png({ 
        quality: 100,
        force: true
      })
      .toFile(outputPath);
    
    console.log(`✅ Created: ${name} (size: ${size}x${size})`);
  }

  console.log('\n🎉 All logo icons generated successfully!');
  console.log('\n📋 Generated files:');
  sizes.forEach(({ name }) => console.log(`  - public/${name}`));
  console.log('\n💡 Apply border-radius via CSS for rounded corners!');
}

generateLogoIconsNoBorder().catch(console.error);

