/**
 * Generate PWA icons và apple-touch-icon
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generatePWAIcons() {
  console.log('🎨 Generating PWA icons...\n');

  const iconSource = path.join(__dirname, 'resources', 'icon.png');
  const publicDir = path.join(__dirname, 'public');

  // Icon sizes for PWA
  const sizes = [
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

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);
    
    console.log(`🔄 Generating ${name} (${size}x${size})...`);
    
    await sharp(iconSource)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log(`✅ Created: ${name}`);
  }

  // Create favicon
  console.log('\n🔄 Generating favicon.ico...');
  const faviconPath = path.join(publicDir, 'favicon.ico');
  await sharp(iconSource)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));
  console.log('✅ Created: favicon.png (rename to .ico if needed)');

  console.log('\n🎉 All PWA icons generated successfully!');
  console.log('\n📋 Generated files:');
  sizes.forEach(({ name }) => console.log(`  - public/${name}`));
  console.log('  - public/favicon.png');
}

generatePWAIcons().catch(console.error);

