/**
 * Script to download free stickers for the chat app
 * Downloads 24 cute emoji-style stickers from OpenMoji (free, open-source)
 * 
 * Usage: node scripts/download-stickers.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const STICKER_COUNT = 24;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');

// OpenMoji emoji IDs for cute/expressive faces (PNG format, 512x512)
// These are free, open-source emojis from OpenMoji project
const EMOJI_IDS = [
  '1F600', // 😀 grinning face
  '1F601', // 😁 beaming face with smiling eyes
  '1F602', // 😂 face with tears of joy
  '1F603', // 😃 grinning face with big eyes
  '1F604', // 😄 grinning face with smiling eyes
  '1F605', // 😅 grinning face with sweat
  '1F606', // 😆 grinning squinting face
  '1F607', // 😇 smiling face with halo
  '1F609', // 😉 winking face
  '1F60A', // 😊 smiling face with smiling eyes
  '1F60B', // 😋 face savoring food
  '1F60C', // 😌 relieved face
  '1F60D', // 😍 smiling face with heart-eyes
  '1F60E', // 😎 smiling face with sunglasses
  '1F60F', // 😏 smirking face
  '1F618', // 😘 face blowing a kiss
  '1F61A', // 😚 kissing face with closed eyes
  '1F61B', // 😛 face with tongue
  '1F61C', // 😜 winking face with tongue
  '1F61D', // 😝 squinting face with tongue
  '1F61E', // 😞 disappointed face
  '1F61F', // 😟 worried face
  '1F620', // 😠 angry face
  '1F621', // 😡 pouting face
];

// Alternative: Use a free sticker API or local generation
// For now, we'll create a script that downloads from OpenMoji CDN
const OPENMOJI_BASE_URL = 'https://openmoji.org/data/color/svg/';

async function downloadSticker(emojiId, index) {
  return new Promise((resolve, reject) => {
    // OpenMoji provides SVG, but we need PNG
    // Alternative: Use a service that converts or provides PNG
    // For now, we'll create a placeholder approach
    
    // Since OpenMoji only provides SVG, we'll use an alternative approach:
    // Use a free emoji PNG service or create placeholders
    
    // Option 1: Use EmojiCDN (provides PNG)
    const url = `https://emojicdn.elk.sh/${emojiId}?size=512`;
    
    const filePath = path.join(OUTPUT_DIR, `${String(index + 1).padStart(3, '0')}.png`);
    
    console.log(`Downloading sticker ${index + 1}/${STICKER_COUNT}: ${emojiId}...`);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✓ Downloaded: ${filePath}`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadSticker(emojiId, index).then(resolve).catch(reject);
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      console.error(`Error downloading ${emojiId}:`, err.message);
      // Create a placeholder file instead
      createPlaceholderSticker(filePath, emojiId).then(resolve).catch(reject);
    });
  });
}

async function createPlaceholderSticker(filePath, emojiId) {
  // Create a simple placeholder - in production, you'd want actual images
  console.log(`Creating placeholder for ${emojiId}...`);
  // For now, just create an empty file - user should replace with actual stickers
  fs.writeFileSync(filePath, '');
  console.log(`Created placeholder: ${filePath}`);
}

async function downloadAllStickers() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Starting download of ${STICKER_COUNT} stickers...`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const stickers = EMOJI_IDS.slice(0, STICKER_COUNT);
  
  for (let i = 0; i < stickers.length; i++) {
    try {
      await downloadSticker(stickers[i], i);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to download sticker ${i + 1}:`, error.message);
    }
  }

  console.log('\n✓ Download complete!');
  console.log('\nNote: If some downloads failed, you can:');
  console.log('1. Manually download stickers from: https://openmoji.org/');
  console.log('2. Or use another free source like: https://www.flaticon.com/');
  console.log('3. Save them as PNG/WebP (512x512px, transparent) in assets/stickers/default/');
}

// Run the script
downloadAllStickers().catch(console.error);

