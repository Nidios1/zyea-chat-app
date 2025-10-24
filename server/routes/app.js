const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Version hiện tại của app
const APP_VERSION = '1.1.0'; // First IPA release with Live Update system

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
• Fix: hieukka v1.0.8

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

module.exports = router;

