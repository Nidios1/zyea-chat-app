const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const postsDir = path.join(__dirname, '../uploads/posts');
const videosDir = path.join(__dirname, '../uploads/videos');
const stickersDir = path.join(__dirname, '../uploads/stickers');

// Ensure directories exist with proper error handling
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  } else {
    console.log('Uploads directory exists:', uploadsDir);
  }
  
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
    console.log('Created posts directory:', postsDir);
  }
  
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
    console.log('Created videos directory:', videosDir);
  }
  
  if (!fs.existsSync(stickersDir)) {
    fs.mkdirSync(stickersDir, { recursive: true });
    console.log('Created stickers directory:', stickersDir);
  }
  
  // Verify write permissions
  try {
    const testFile = path.join(uploadsDir, '.test-write');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Uploads directory is writable');
  } catch (writeError) {
    console.error('ERROR: Uploads directory is not writable:', writeError.message);
    console.error('Please check permissions for:', uploadsDir);
  }
} catch (error) {
  console.error('ERROR creating upload directories:', error);
  console.error('Uploads directory path:', uploadsDir);
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Upload image endpoint
router.post('/image', authenticateToken, upload.single('image'), (req, res) => {
  try {
    console.log('Image upload request received');
    console.log('Request file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'No file');
    
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Verify file was saved
    if (!fs.existsSync(req.file.path)) {
      console.error('File was not saved to disk:', req.file.path);
      return res.status(500).json({ 
        success: false, 
        message: 'File was not saved to server. Please check uploads directory permissions.' 
      });
    }

    // Generate URL for the uploaded image
    const imageUrl = `/uploads/${req.file.filename}`;
    
    console.log('Image uploaded successfully:', {
      filename: req.file.filename,
      path: req.file.path,
      url: imageUrl,
      size: req.file.size
    });
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Image upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Upload post image endpoint
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const postUpload = multer({
  storage: postStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

router.post('/post', authenticateToken, postUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }

    // Generate URL for the uploaded image - path relative to server root
    const imageUrl = `uploads/posts/${req.file.filename}`;
    
    res.json({
      success: true,
      url: imageUrl, // Changed from imageUrl to url to match client expectation
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Post image upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading image' 
    });
  }
});

// Upload video endpoint
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Keep original extension for videos
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, 'video-' + uniqueSuffix + ext);
  }
});

const videoFileFilter = (req, file, cb) => {
  // Accept video files
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for videos - tăng từ 100MB để hỗ trợ video dài
  },
  fileFilter: videoFileFilter
});

router.post('/video', authenticateToken, videoUpload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No video file provided' 
      });
    }

    // Generate URL for the uploaded video - path relative to server root
    const videoUrl = `uploads/videos/${req.file.filename}`;
    
    res.json({
      success: true,
      url: videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error uploading video' 
    });
  }
});

// Upload sticker endpoint (supports .webp, .png, .jpg, .jpeg, .gif)
const stickerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, stickersDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Keep original extension
    const ext = path.extname(file.originalname) || '.webp';
    cb(null, 'sticker-' + uniqueSuffix + ext);
  }
});

const stickerFileFilter = (req, file, cb) => {
  // Accept image files: webp, png, jpg, jpeg, gif
  const allowedMimes = ['image/webp', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (webp, png, jpg, jpeg, gif) are allowed!'), false);
  }
};

const stickerUpload = multer({
  storage: stickerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for stickers
  },
  fileFilter: stickerFileFilter
});

router.post('/sticker', authenticateToken, stickerUpload.single('sticker'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No sticker file provided' 
      });
    }

    // Determine file format from extension
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileFormat = ext === 'jpg' ? 'jpeg' : ext;
    
    // Generate URL for the uploaded sticker
    const stickerUrl = `uploads/stickers/${req.file.filename}`;
    
    res.json({
      success: true,
      url: stickerUrl,
      imageUrl: stickerUrl, // Alias for compatibility
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileFormat: fileFormat,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Sticker upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error uploading sticker' 
    });
  }
});

// Serve uploaded images
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Image not found' });
  }
  
  res.sendFile(filePath);
});

// Serve sticker images
router.get('/uploads/stickers/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(stickersDir, filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Sticker not found' });
  }
  
  res.sendFile(filePath);
});

module.exports = router;
