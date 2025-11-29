const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getConnection } = require('../config/database');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Kiểm tra kết nối database
    const connection = getConnection();
    await connection.execute('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Version hiện tại của app
const APP_VERSION = '1.1.6'; // Force update - version badge removed

/**
 * GET /api/app/version
 * Endpoint để check version mới nhất
 */
router.get('/version', async (req, res) => {
  try {
    // Đọc version info từ file hoặc database
    // Ở đây tôi hardcode, bạn có thể lưu vào database
    const versionInfo = {
      version: APP_VERSION,
      updateUrl: 'http://192.168.0.102:5000/api/app/download/latest',
      changeLog: `
• Fix Critical: Xóa hoàn toàn nút test "v1.1.x LIVE" khỏi màn hình
• Clean: UI sạch sẽ, không còn phần debug
• Improve: Live Update ổn định, cập nhật code đầy đủ
      `.trim(),
      mandatory: false, // true = bắt buộc update, false = có thể bỏ qua
      releaseDate: new Date().toISOString(),
      minSupportedVersion: '0.9.0' // Version thấp nhất được support
    };
    
    res.json(versionInfo);
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({ error: 'Failed to get version info' });
  }
});

/**
 * GET /api/app/download/latest
 * Download bundle mới nhất (zip file chứa build/)
 */
router.get('/download/latest', async (req, res) => {
  try {
    // Path tới build bundle
    const bundlePath = path.join(__dirname, '../../client/build.zip');
    
    // Check xem file có tồn tại không
    if (!fs.existsSync(bundlePath)) {
      return res.status(404).json({ 
        error: 'Update bundle not found',
        message: 'Vui lòng build bundle trước: cd client && npm run build && zip -r build.zip build/'
      });
    }
    
    // Send file
    res.download(bundlePath, 'build.zip', (err) => {
      if (err) {
        console.error('Error sending update bundle:', err);
        res.status(500).json({ error: 'Failed to download update' });
      }
    });
  } catch (error) {
    console.error('Error downloading update:', error);
    res.status(500).json({ error: 'Failed to download update' });
  }
});

/**
 * POST /api/app/report-version
 * Report version hiện tại của user (để tracking)
 */
router.post('/report-version', async (req, res) => {
  try {
    const { version, platform, deviceInfo } = req.body;
    
    console.log('📱 Version Report:', {
      version,
      platform,
      deviceInfo,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Lưu vào database để tracking
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error reporting version:', error);
    res.status(500).json({ error: 'Failed to report version' });
  }
});

/**
 * POST /api/app/deploy-update
 * Deploy build mới từ build.zip (chỉ dùng trong development)
 * NOTE: Trong production, nên dùng CI/CD pipeline
 */
router.post('/deploy-update', async (req, res) => {
  try {
    const AdmZip = require('adm-zip');
    const zipPath = path.join(__dirname, '../../client/build.zip');
    const buildPath = path.join(__dirname, '../../client/build');
    
    // Check xem file zip có tồn tại không
    if (!fs.existsSync(zipPath)) {
      return res.status(404).json({ 
        error: 'build.zip not found',
        message: 'Vui lòng build app trước: cd client && npm run build'
      });
    }
    
    // Backup build cũ (nếu có)
    if (fs.existsSync(buildPath)) {
      const backupPath = path.join(__dirname, '../../client/build-backup');
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }
      fs.renameSync(buildPath, backupPath);
      console.log('✅ Backed up old build');
    }
    
    // Extract build.zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(path.join(__dirname, '../../client'), true);
    console.log('✅ Extracted new build');
    
    res.json({ 
      success: true,
      message: 'Build deployed successfully',
      version: APP_VERSION
    });
  } catch (error) {
    console.error('Error deploying update:', error);
    
    // Rollback nếu có lỗi
    const buildPath = path.join(__dirname, '../../client/build');
    const backupPath = path.join(__dirname, '../../client/build-backup');
    
    if (fs.existsSync(backupPath)) {
      if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true, force: true });
      }
      fs.renameSync(backupPath, buildPath);
      console.log('🔄 Rolled back to previous build');
    }
    
    res.status(500).json({ error: 'Failed to deploy update' });
  }
});

/**
 * GET /api/app/sticker-packs
 * Public endpoint để mobile app load sticker packs
 */
router.get('/sticker-packs', async (req, res) => {
  try {
    console.log('📦 API: Fetching sticker packs...');
    const connection = getConnection();
    
    if (!connection) {
      console.error('❌ API: Database connection is null');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
    const [packs] = await connection.execute(`
      SELECT sp.id, sp.name, sp.title, sp.icon_url,
             COUNT(s.id) as sticker_count
      FROM sticker_packs sp
      LEFT JOIN stickers s ON sp.id = s.pack_id
      WHERE sp.is_active = TRUE
      GROUP BY sp.id
      ORDER BY sp.sort_order ASC, sp.created_at DESC
    `);
    
    console.log('📦 API: Found', packs.length, 'packs');
    
    if (packs.length === 0) {
      console.warn('⚠️ API: No active sticker packs found in database');
      return res.json({ packs: [] });
    }
    
    // Load stickers for each pack
    const packsWithStickers = await Promise.all(
      packs.map(async (pack) => {
        const [stickers] = await connection.execute(
          'SELECT id, image_url, file_format, is_animated FROM stickers WHERE pack_id = ? ORDER BY sort_order ASC, id ASC',
          [pack.id]
        );
        console.log(`📦 API: Pack ${pack.id} (${pack.name}) has ${stickers.length} stickers`);
        return {
          id: String(pack.id), // Convert to string để match với packId trong message
          name: pack.name,
          title: pack.title,
          icon_url: pack.icon_url,
          sticker_count: pack.sticker_count,
          stickers: stickers.map(s => ({
            id: s.id,
            url: s.image_url,
            format: s.file_format,
            isAnimated: s.is_animated
          }))
        };
      })
    );
    
    console.log('📦 API: Returning', packsWithStickers.length, 'packs with stickers');
    res.json({ packs: packsWithStickers });
  } catch (error) {
    console.error('❌ API: Error getting sticker packs:', error);
    console.error('❌ API: Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to get sticker packs',
      message: error.message 
    });
  }
});

module.exports = router;

