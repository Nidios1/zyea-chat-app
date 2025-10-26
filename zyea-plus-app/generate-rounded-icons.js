const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// iOS icon sizes (rounded rectangle with 22.5% corner radius)
const iosSizes = [
  { size: 20, output: 'AppIcon-20.png' },
  { size: 29, output: 'AppIcon-29.png' },
  { size: 40, output: 'AppIcon-40.png' },
  { size: 58, output: 'AppIcon-58.png' },
  { size: 60, output: 'AppIcon-60.png' },
  { size: 76, output: 'AppIcon-76.png' },
  { size: 80, output: 'AppIcon-80.png' },
  { size: 87, output: 'AppIcon-87.png' },
  { size: 120, output: 'AppIcon-120.png' },
  { size: 152, output: 'AppIcon-152.png' },
  { size: 167, output: 'AppIcon-167.png' },
  { size: 180, output: 'AppIcon-180.png' },
  { size: 1024, output: 'AppIcon-1024.png' }
];

async function generateRoundedIcon(inputPath, size, outputPath) {
  const cornerRadius = Math.round(size * 0.225); // 22.5% corner radius for iOS
  
  // Create rounded rectangle mask
  const roundedCorners = Buffer.from(
    `<svg>
      <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
    </svg>`
  );
  
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .composite([{
        input: roundedCorners,
        blend: 'dest-in'
      }])
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error creating ${outputPath}:`, error.message);
  }
}

async function main() {
  console.log('🎨 Generating rounded iOS app icons...\n');
  
  const inputIcon = path.join(__dirname, 'resources', 'icon.png');
  const iosAssetsPath = path.join(__dirname, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  
  // Check if input exists
  if (!fs.existsSync(inputIcon)) {
    console.error('❌ Icon not found at:', inputIcon);
    console.log('Please make sure resources/icon.png exists!');
    return;
  }
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(iosAssetsPath)) {
    fs.mkdirSync(iosAssetsPath, { recursive: true });
  }
  
  // Generate all icon sizes
  for (const { size, output } of iosSizes) {
    const outputPath = path.join(iosAssetsPath, output);
    await generateRoundedIcon(inputIcon, size, outputPath);
  }
  
  // Generate Contents.json
  const contentsJson = {
    images: [
      { size: "20x20", idiom: "iphone", filename: "AppIcon-40.png", scale: "2x" },
      { size: "20x20", idiom: "iphone", filename: "AppIcon-60.png", scale: "3x" },
      { size: "29x29", idiom: "iphone", filename: "AppIcon-58.png", scale: "2x" },
      { size: "29x29", idiom: "iphone", filename: "AppIcon-87.png", scale: "3x" },
      { size: "40x40", idiom: "iphone", filename: "AppIcon-80.png", scale: "2x" },
      { size: "40x40", idiom: "iphone", filename: "AppIcon-120.png", scale: "3x" },
      { size: "60x60", idiom: "iphone", filename: "AppIcon-120.png", scale: "2x" },
      { size: "60x60", idiom: "iphone", filename: "AppIcon-180.png", scale: "3x" },
      { size: "20x20", idiom: "ipad", filename: "AppIcon-20.png", scale: "1x" },
      { size: "20x20", idiom: "ipad", filename: "AppIcon-40.png", scale: "2x" },
      { size: "29x29", idiom: "ipad", filename: "AppIcon-29.png", scale: "1x" },
      { size: "29x29", idiom: "ipad", filename: "AppIcon-58.png", scale: "2x" },
      { size: "40x40", idiom: "ipad", filename: "AppIcon-40.png", scale: "1x" },
      { size: "40x40", idiom: "ipad", filename: "AppIcon-80.png", scale: "2x" },
      { size: "76x76", idiom: "ipad", filename: "AppIcon-76.png", scale: "1x" },
      { size: "76x76", idiom: "ipad", filename: "AppIcon-152.png", scale: "2x" },
      { size: "83.5x83.5", idiom: "ipad", filename: "AppIcon-167.png", scale: "2x" },
      { size: "1024x1024", idiom: "ios-marketing", filename: "AppIcon-1024.png", scale: "1x" }
    ],
    info: {
      author: "xcode",
      version: 1
    }
  };
  
  const contentsPath = path.join(iosAssetsPath, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(contentsJson, null, 2));
  console.log(`\n✅ Created: Contents.json`);
  
  console.log('\n🎉 Done! All icons generated successfully!');
  console.log('\n📱 Next steps:');
  console.log('1. Run: npx cap sync ios');
  console.log('2. Build IPA on GitHub');
  console.log('3. Install on iPhone');
}

main().catch(console.error);

