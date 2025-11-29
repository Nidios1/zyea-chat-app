import { API_BASE_URL } from '../config/constants';

// Get Avatar URL
export const getAvatarURL = (avatarPath: string | null | undefined): string => {
  if (!avatarPath || avatarPath.trim() === '' || avatarPath === 'null' || avatarPath === 'undefined') {
    return '';
  }

  // If already a full URL
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Ensure path starts with / if it doesn't
  let cleanPath = avatarPath;
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  // Handle /assets/ paths (for system user logo, etc.)
  if (cleanPath.startsWith('/assets/')) {
    const fullURL = `${API_BASE_URL.replace('/api', '')}${cleanPath}`;
    return fullURL;
  }

  // If path already includes /uploads/avatars/, use as is
  if (cleanPath.includes('/uploads/avatars/')) {
    const fullURL = `${API_BASE_URL.replace('/api', '')}${cleanPath}`;
    return fullURL;
  }

  // Construct full URL
  const fullURL = `${API_BASE_URL.replace('/api', '')}/uploads/avatars${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
  return fullURL;
};

// Get Image URL - handles both chat images and post images
// IMPORTANT: Always returns full-size image URL, removes thumbnail/small/medium suffixes
export const getImageURL = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '';
  }

  // Normalize path - remove thumbnail/small/medium suffixes to get full-size image
  let normalizedPath = imagePath.trim();
  
  // Remove common thumbnail/size suffixes to get original full-size image
  // Examples: image_thumb.jpg -> image.jpg, image_small.jpg -> image.jpg, image_medium.jpg -> image.jpg
  // Match patterns like: filename_thumb.jpg, filename_small.jpg, etc.
  const sizeSuffixes = ['_thumb', '_small', '_medium', '_large', '_thumbnail', 'thumbnail'];
  for (const suffix of sizeSuffixes) {
    // Match suffix before file extension
    const regex = new RegExp(`${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.[^.]+)?$`, 'i');
    normalizedPath = normalizedPath.replace(regex, (match, ext) => ext || '');
  }

  // If already a full URL
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    try {
      // Also remove size suffixes from full URLs
      const url = new URL(normalizedPath);
      let pathname = url.pathname;
      
      // Remove size suffixes from pathname
      for (const suffix of sizeSuffixes) {
        const regex = new RegExp(`${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.[^.]+)?$`, 'i');
        pathname = pathname.replace(regex, (match, ext) => ext || '');
      }
      
      url.pathname = pathname;
      return url.toString();
    } catch (e) {
      // If URL parsing fails, return original
      return normalizedPath;
    }
  }

  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // If path starts with /uploads/ (with leading slash)
  if (normalizedPath.startsWith('/uploads/')) {
    return `${baseUrl}${normalizedPath}`;
  }
  
  // If path starts with uploads/ (without leading slash)
  if (normalizedPath.startsWith('uploads/')) {
    return `${baseUrl}/${normalizedPath}`;
  }
  
  // If path contains /uploads/ anywhere (e.g., uploads/posts/... or uploads/videos/...)
  if (normalizedPath.includes('/uploads/')) {
    // Ensure it starts with /
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    return `${baseUrl}${normalizedPath}`;
  }

  // Default: assume it's a filename in /uploads/ directory (for chat images)
  // Server returns paths like: /uploads/image-xxx.jpg or uploads/image-xxx.jpg
  return `${baseUrl}/uploads/${normalizedPath}`;
};

// Get Video URL
export const getVideoURL = (videoPath: string | null | undefined): string => {
  if (!videoPath || videoPath.trim() === '' || videoPath === 'null' || videoPath === 'undefined') {
    return '';
  }

  // Trim whitespace
  const trimmedPath = videoPath.trim();

  // If already a full URL
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }

  const baseUrl = API_BASE_URL.replace('/api', '');

  // If path already includes /uploads/videos/, use as is
  if (trimmedPath.includes('/uploads/videos/')) {
    // Ensure it starts with /
    const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : '/' + trimmedPath;
    return `${baseUrl}${normalizedPath}`;
  }

  // If path starts with uploads/videos/ (without leading slash)
  if (trimmedPath.startsWith('uploads/videos/')) {
    return `${baseUrl}/${trimmedPath}`;
  }

  // If path contains uploads/videos/ anywhere
  if (trimmedPath.includes('uploads/videos/')) {
    const normalizedPath = trimmedPath.startsWith('/') ? trimmedPath : '/' + trimmedPath;
    return `${baseUrl}${normalizedPath}`;
  }

  // Construct full URL from filename only
  // Remove leading slash if present to avoid double slashes
  const cleanPath = trimmedPath.startsWith('/') ? trimmedPath.substring(1) : trimmedPath;
  return `${baseUrl}/uploads/videos/${cleanPath}`;
};

// Get Initials from name
export const getInitials = (name?: string): string => {
  if (!name) return 'U';

  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

// Get avatar color based on name - shared utility function
export const getAvatarColor = (name?: string): string => {
  if (!name) return '#0084ff';
  const colors = ['#0084ff', '#00a651', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f59e0b', '#8b5cf6', '#ec4899'];
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Create FormData from image
export const createImageFormData = (
  imageUri: string,
  fileName: string = 'image.jpg'
): FormData => {
  const formData = new FormData();
  
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: fileName,
  } as any);

  return formData;
};

// Validate image size (max 5MB)
export const validateImageSize = (bytes: number): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return bytes <= maxSize;
};

// Compress image (placeholder for actual compression logic)
export const compressImage = async (imageUri: string): Promise<string> => {
  // TODO: Implement image compression using react-native-image-resizer
  return imageUri;
};

// Get Sticker URL from database path
export const getStickerURL = (stickerPath: string | null | undefined): string => {
  if (!stickerPath) {
    return '';
  }

  // If already a full URL
  if (stickerPath.startsWith('http://') || stickerPath.startsWith('https://')) {
    return stickerPath;
  }

  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // Normalize path
  let normalizedPath = stickerPath.trim();
  
  // If path starts with /uploads/stickers/
  if (normalizedPath.startsWith('/uploads/stickers/')) {
    return `${baseUrl}${normalizedPath}`;
  }
  
  // If path starts with uploads/stickers/ (without leading slash)
  if (normalizedPath.startsWith('uploads/stickers/')) {
    return `${baseUrl}/${normalizedPath}`;
  }
  
  // Default: assume it's a filename in /uploads/stickers/ directory
  return `${baseUrl}/uploads/stickers/${normalizedPath}`;
};

