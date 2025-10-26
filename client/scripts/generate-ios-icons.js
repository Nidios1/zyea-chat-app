/**
 * Generate all iOS icon sizes from resources/icon.png
 */

const fs = require('fs');
const path = require('path');

async function generateIOSIcons() {
  console.log('📱 Generating all iOS icon sizes...\n');
  
  try {
    const sharp = require('sharp');
    
    const projectRoot = path.join(__dirname, '..');
    const sourceIcon = path.join(projectRoot, 'resources', 'icon.png');
    const outputDir = path.join(projectRoot, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
    
    if (!fs.existsSync(sourceIcon)) {
      throw new Error('Source icon not found: ' + sourceIcon);
    }
    
    // iOS icon sizes needed
    const iconSizes = [
      { name: 'AppIcon-20x20@1x.png', size: 20 },
      { name: 'AppIcon-20x20@2x.png', size: 40 },
      { name: 'AppIcon-20x20@3x.png', size: 60 },
      { name: 'AppIcon-29x29@1x.png', size: 29 },
      { name: 'AppIcon-29x29@2x.png', size: 58 },
      { name: 'AppIcon-29x29@3x.png', size: 87 },
      { name: 'AppIcon-40x40@1x.png', size: 40 },
      { name: 'AppIcon-40x40@2x.png', size: 80 },
      { name: 'AppIcon-40x40@3x.png', size: 120 },
      { name: 'AppIcon-60x60@2x.png', size: 120 },
      { name: 'AppIcon-60x60@3x.png', size: 180 },
      { name: 'AppIcon-76x76@1x.png', size: 76 },
      { name: 'AppIcon-76x76@2x.png', size: 152 },
      { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
      { name: 'AppIcon-1024x1024@1x.png', size: 1024 }
    ];
    
    console.log(`📸 Source: ${sourceIcon}`);
    console.log(`📁 Output: ${outputDir}\n`);
    
    // Create output directory if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Generate each size
    for (const icon of iconSizes) {
      const outputPath = path.join(outputDir, icon.name);
      await sharp(sourceIcon)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 100 })
        .toFile(outputPath);
      
      console.log(`✅ ${icon.name} (${icon.size}x${icon.size})`);
    }
    
    console.log('\n🎉 All iOS icons generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Commit changes');
    console.log('2. Push to GitHub để build IPA tự động');
    console.log('3. Hoặc chạy: npx cap sync ios (trên macOS)\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('- resources/icon.png exists');
    console.error('- sharp is installed (npm install sharp)');
    process.exit(1);
  }
}

generateIOSIcons();

