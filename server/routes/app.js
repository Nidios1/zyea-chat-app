const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Version hiện tại của app
const APP_VERSION = '1.0.2'; // Fix MobileSidebar responsive for iPhone

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
• Fix: Sửa lỗi UI bị đè lên nhau trên iPhone
• Improve: Tối ưu responsive layout cho màn hình nhỏ
• Improve: Giảm kích thước avatar và padding cho mobile
• Fix: Text overflow trong danh sách chat
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
    res.download(bundlePath, 'app-update.zip', (err) => {
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

module.exports = router;

