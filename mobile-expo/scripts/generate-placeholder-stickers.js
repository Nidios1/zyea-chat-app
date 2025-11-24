/**
 * Generate placeholder sticker images using Canvas (Node.js)
 * This creates simple colored squares with emoji text as placeholders
 * 
 * Note: Requires 'canvas' package: npm install canvas
 * 
 * Usage: node scripts/generate-placeholder-stickers.js
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.error('Canvas package not found. Installing...');
  console.error('Please run: npm install canvas');
  console.error('\nAlternatively, you can:');
  console.error('1. Download free stickers from https://openmoji.org/');
  console.error('2. Or use the download-stickers.js script');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'stickers', 'default');
const STICKER_COUNT = 24;
const SIZE = 512;

// Emoji list for placeholder stickers
const EMOJIS = [
  '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇',
  '😉', '😊', '😋', '😌', '😍', '😎', '😏', '😘',
  '😗', '😙', '😚', '😛', '😜', '😝', '😞', '😟',
];

// Colors for background (pastel colors)
const COLORS = [
  '#FFB6C1', '#FFA07A', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD',
  '#F0E68C', '#FFB347', '#FFCCCB', '#B0E0E6', '#FFE4E1', '#E0E0E0',
  '#FFE4B5', '#FFEFD5', '#FFF8DC', '#F5F5DC', '#E6E6FA', '#FFF0F5',
  '#F0FFF0', '#F5FFFA', '#F0FFFF', '#F5F5F5', '#FFFACD', '#FFE4E1',
];

function generateSticker(index) {
  const canvas = Canvas.createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Draw colored circle background
  const color = COLORS[index % COLORS.length];
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw emoji in center
  const emoji = EMOJIS[index % EMOJIS.length];
  ctx.font = 'bold 300px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, SIZE / 2, SIZE / 2);

  return canvas;
}

async function generateAllStickers() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating ${STICKER_COUNT} placeholder stickers...`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  for (let i = 0; i < STICKER_COUNT; i++) {
    const canvas = generateSticker(i);
    const filename = `${String(i + 1).padStart(3, '0')}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filepath, buffer);

    console.log(`✓ Generated: ${filename}`);
  }

  console.log(`\n✓ Generated ${STICKER_COUNT} placeholder stickers!`);
  console.log('\nNote: These are placeholder stickers. For production:');
  console.log('1. Replace with actual sticker images (512x512px, transparent PNG)');
  console.log('2. Download from: https://openmoji.org/ or other free sources');
  console.log('3. Update stickerData.ts to uncomment the require statements');
}

// Run the script
generateAllStickers().catch(console.error);

