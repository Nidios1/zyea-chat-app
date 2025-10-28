/**
 * Script loại bỏ viền trắng từ logo và generate icon
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function removeWhiteBorder() {
  console.log('🎨 Loại bỏ viền trắng từ logo...\n');

  const iconSource = path.join(__dirname, '..', 'public', 'Zyea.jpg');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(iconSource)) {
    console.error('❌ Source file not found:', iconSource);
    return;
  }

  // Đọc ảnh gốc
  const image = sharp(iconSource);
  const metadata = await image.metadata();
  const { width, height } = metadata;

  console.log(`📐 Kích thước ảnh gốc: ${width}x${height}`);

  // Tạo ảnh transparent background (loại bỏ màu trắng)
  const processedImage = await image
    .ensureAlpha() // Đảm bảo có alpha channel
    .png({ quality: 100, force: true })
    .toBuffer();

  // Icon sizes
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

  // Border radius (28% để bo tròn đẹp)
  const borderRadius = 0.28;

  for (const { size, name } of sizes) {
    const outputPath = path.join(publicDir, name);
    const radius = Math.round(size * borderRadius);
    
    console.log(`🔄 Generating ${name} (${size}x${size}, radius: ${radius}px)...`);
    
    // Tạo SVG mask với border radius
    const svgMask = `
      <svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
      </svg>
    `;

    const paddedSize = Math.round(size * 1.1); // Tăng size 10% để crop
    
    await sharp(processedImage)
      .resize(paddedSize, paddedSize, {
        fit: 'cover',
        position: 'center'
      })
      .extract({
        left: Math.round(size * 0.05),
        top: Math.round(size * 0.05),
        width: size,
        height: size
      })
      .composite([
        {
          input: Buffer.from(svgMask),
          blend: 'dest-in'
        }
      ])
      .png({ 
        quality: 100,
        compressionLevel: 9
      })
      .toFile(outputPath);
    
    console.log(`✅ Created: ${name}`);
  }

  console.log('\n🎉 Đã tạo tất cả icon không có viền trắng!');
}

removeWhiteBorder().catch(console.error);

