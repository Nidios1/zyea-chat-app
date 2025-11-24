/**
 * Quick script to download 24 free emoji stickers
 * Uses EmojiCDN API - free, no API key required
 * 
 * Usage: node scripts/quick-download-stickers.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 24;

// Popular emoji Unicode codes for expressive faces
const EMOJI_UNICODES = [
  '1F600', // 😀
  '1F601', // 😁
  '1F602', // 😂
  '1F603', // 😃
  '1F604', // 😄
  '1F605', // 😅
  '1F606', // 😆
  '1F607', // 😇
  '1F609', // 😉
  '1F60A', // 😊
  '1F60B', // 😋
  '1F60C', // 😌
  '1F60D', // 😍
  '1F60E', // 😎
  '1F60F', // 😏
  '1F618', // 😘
  '1F61A', // 😚
  '1F61B', // 😛
  '1F61C', // 😜
  '1F61D', // 😝
  '1F61E', // 😞
  '1F61F', // 😟
  '1F620', // 😠
  '1F621', // 😡
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadSticker(unicode, index) {
  const filename = `${String(index + 1).padStart(3, '0')}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Try multiple CDN sources
  const urls = [
    `https://emojicdn.elk.sh/${unicode}?size=512`,
    `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${unicode}.png`,
    `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${unicode}.png`,
  ];
  
  console.log(`[${index + 1}/${STICKER_COUNT}] Downloading emoji ${unicode}...`);
  
  for (let i = 0; i < urls.length; i++) {
    try {
      await downloadFile(urls[i], filepath);
      
      // Verify file was downloaded (not empty)
      const stats = fs.statSync(filepath);
      if (stats.size > 0) {
        console.log(`  ✓ Success: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
        return;
      } else {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      if (i === urls.length - 1) {
        console.log(`  ✗ Failed: ${filename} - ${error.message}`);
        // Create empty placeholder
        fs.writeFileSync(filepath, '');
      }
    }
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('='.repeat(50));
  console.log('Downloading Default Stickers');
  console.log('='.repeat(50));
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Count: ${STICKER_COUNT} stickers\n`);

  const stickers = EMOJI_UNICODES.slice(0, STICKER_COUNT);
  
  for (let i = 0; i < stickers.length; i++) {
    await downloadSticker(stickers[i], i);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '='.repeat(50));
  console.log('Download Complete!');
  console.log('='.repeat(50));
  
  // Check results
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  const validFiles = files.filter(f => {
    const stats = fs.statSync(path.join(OUTPUT_DIR, f));
    return stats.size > 0;
  });
  
  console.log(`\nDownloaded: ${validFiles.length}/${STICKER_COUNT} valid stickers`);
  
  if (validFiles.length < STICKER_COUNT) {
    console.log('\n⚠ Some stickers failed to download.');
    console.log('You can:');
    console.log('1. Run the script again (some CDNs may be temporarily unavailable)');
    console.log('2. Manually download from: https://openmoji.org/');
    console.log('3. Use generate-placeholder-stickers.js for testing');
  } else {
    console.log('\n✓ All stickers downloaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Open src/data/stickerData.ts');
    console.log('2. Uncomment all require() statements for default pack');
    console.log('3. Restart your app: npm start');
  }
}

main().catch(console.error);

