/**
 * Generate a better splash screen with logo centered
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateSplash() {
  console.log('🎨 Generating better splash screen...\n');

  const iconSource = path.join(__dirname, 'resources', 'icon.png');
  const splashOutput = path.join(__dirname, 'resources', 'splash.png');
  
  if (!fs.existsSync(iconSource)) {
    console.error('❌ Icon not found:', iconSource);
    return;
  }

  // iOS splash screen size (largest)
  const width = 2732;
  const height = 2732;
  
  // Background color
  const bgColor = { r: 0, g: 132, b: 255 }; // #0084ff
  
  // Create gradient-like effect with multiple layers
  const gradient = await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: bgColor
    }
  })
  .composite([
    // Top gradient overlay
    {
      input: Buffer.from(
        `<svg width="${width}" height="${height}">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:rgb(0,132,255);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(0,166,81);stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#grad)" />
        </svg>`
      ),
      top: 0,
      left: 0
    }
  ])
  .png()
  .toBuffer();

  // Load and resize logo to be smaller (about 30% of screen)
  const logoSize = Math.floor(width * 0.25); // 25% of width
  const logo = await sharp(iconSource)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // Composite logo onto gradient background (centered)
  const logoLeft = Math.floor((width - logoSize) / 2);
  const logoTop = Math.floor((height - logoSize) / 2);

  await sharp(gradient)
    .composite([
      {
        input: logo,
        top: logoTop,
        left: logoLeft
      }
    ])
    .png()
    .toFile(splashOutput);

  console.log('✅ Splash screen created:', splashOutput);
  console.log(`   Size: ${width}x${height}`);
  console.log(`   Logo: ${logoSize}x${logoSize} (centered)`);
  console.log(`   Background: Gradient #0084ff → #00a651\n`);
}

generateSplash().catch(console.error);

