/**
 * Generate PWA icons từ Zyea.jpg với border-radius đẹp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateLogoIcons() {
  console.log('🎨 Generating logo icons from Zyea.jpg...\n');

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
    { size: 180, name: 'apple-touch-icon.png' }, // iOS home screen
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' },
  ];

  // Border radius cho icon (khoảng 26% để có góc tròn đẹp hơn, bo sát logo)
  const borderRadius = 0.26; // ~26% để border-radius lớn hơn, loại bỏ viền trắng

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);
    
    console.log(`🔄 Generating ${name} (${size}x${size})...`);
    
    // Tính border radius dựa trên size
    const radius = Math.round(size * borderRadius);
    
    // Tạo SVG mask cho border radius với transparent background
    const svg = `
      <svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>
    `;
    
    // Resize và crop image, loại bỏ viền trắng xung quanh
    await sharp(iconSource)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .composite([
        {
          input: Buffer.from(svg),
          blend: 'dest-in'
        }
      ])
      .png({ 
        quality: 100,
        force: true
      })
      .toFile(outputPath);
    
    console.log(`✅ Created: ${name} (with ${radius}px border radius)`);
  }

  console.log('\n🎉 All logo icons generated successfully!');
  console.log('\n📋 Generated files:');
  sizes.forEach(({ name }) => console.log(`  - public/${name}`));
  console.log('\n💡 All icons have border-radius for beautiful app look!');
}

generateLogoIcons().catch(console.error);

