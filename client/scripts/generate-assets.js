/**
 * Script tự động generate iOS assets từ JPG
 * Chạy: node generate-assets.js
 */

const fs = require('fs');
const path = require('path');

async function generateAssets() {
  console.log('🎨 Starting iOS assets generation...\n');
  
  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.log('❌ Sharp module not found!');
      console.log('📦 Installing sharp...\n');
      const { execSync } = require('child_process');
      execSync('npm install sharp', { stdio: 'inherit' });
      sharp = require('sharp');
    }

    // Create resources folder if not exists
    const projectRoot = path.join(__dirname, '..');
    const resourcesDir = path.join(projectRoot, 'resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
      console.log('✅ Created resources directory');
    }

    // Source files
    const sourceJPG = path.join(projectRoot, 'public', 'Zyea.jpg');
    const altSourceJPG = path.join(projectRoot, 'public', 'app.jpg');
    
    let inputFile = sourceJPG;
    if (!fs.existsSync(sourceJPG)) {
      if (fs.existsSync(altSourceJPG)) {
        inputFile = altSourceJPG;
      } else {
        throw new Error('❌ Không tìm thấy file Zyea.jpg hoặc app.jpg trong public/');
      }
    }

    console.log(`📸 Using source image: ${path.basename(inputFile)}\n`);

    // Output files
    const iconOutput = path.join(resourcesDir, 'icon.png');
    const splashOutput = path.join(resourcesDir, 'splash.png');
    
    // Generate icon (1024x1024)
    console.log('🔄 Generating icon.png (1024x1024)...');
    await sharp(inputFile)
      .resize(1024, 1024, { 
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 100 })
      .toFile(iconOutput);
    console.log('✅ Icon created:', iconOutput);
    
    // Generate splash with background (2732x2732)
    console.log('🔄 Generating splash.png (2732x2732)...');
    
    // First, create a blue background
    const bgColor = { r: 0, g: 132, b: 255 }; // #0084ff
    
    await sharp(inputFile)
      .resize(2000, 2000, { 
        fit: 'inside',
        position: 'center',
        background: bgColor
      })
      .extend({
        top: 366,
        bottom: 366,
        left: 366,
        right: 366,
        background: bgColor
      })
      .png({ quality: 100 })
      .toFile(splashOutput);
    console.log('✅ Splash created:', splashOutput);

    console.log('\n🎉 Assets generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npx @capacitor/assets generate');
    console.log('2. Run: npm run build');
    console.log('3. Run: npx cap sync ios (requires macOS)');
    console.log('4. Or push to GitHub để build IPA tự động\n');

    // Try to run capacitor-assets if available
    console.log('🔄 Attempting to run capacitor-assets generate...\n');
    const { execSync } = require('child_process');
    
    try {
      execSync('npx @capacitor/assets generate --iconBackgroundColor "#0084ff" --splashBackgroundColor "#0084ff"', { 
        stdio: 'inherit',
        cwd: projectRoot
      });
      console.log('\n✅ Capacitor assets generated!');
    } catch (error) {
      console.log('\n⚠️  Could not run @capacitor/assets automatically.');
      console.log('📦 Install it manually: npm install -g @capacitor/assets');
      console.log('Then run: npx @capacitor/assets generate\n');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure you have:');
    console.error('- Zyea.jpg or app.jpg in public/ folder');
    console.error('- Node.js installed');
    console.error('- Run: npm install sharp (if not installed automatically)\n');
    process.exit(1);
  }
}

// Run the script
generateAssets();

