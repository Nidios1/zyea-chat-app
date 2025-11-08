import { API_BASE_URL } from '../config/constants';

// Get Avatar URL
export const getAvatarURL = (avatarPath: string | null | undefined): string => {
  if (!avatarPath || avatarPath.trim() === '' || avatarPath === 'null' || avatarPath === 'undefined') {
    console.log('⚠️ getAvatarURL: Empty or invalid avatarPath:', avatarPath);
    return '';
  }

  // If already a full URL
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    console.log('✅ getAvatarURL: Already full URL:', avatarPath);
    return avatarPath;
  }

  // Ensure path starts with / if it doesn't
  let cleanPath = avatarPath;
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  // If path already includes /uploads/avatars/, use as is
  if (cleanPath.includes('/uploads/avatars/')) {
    const fullURL = `${API_BASE_URL.replace('/api', '')}${cleanPath}`;
    console.log('✅ getAvatarURL: Constructed URL from path:', fullURL);
    return fullURL;
  }

  // Construct full URL
  const fullURL = `${API_BASE_URL.replace('/api', '')}/uploads/avatars${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
  console.log('✅ getAvatarURL: Constructed URL:', fullURL);
  return fullURL;
};

// Get Image URL
export const getImageURL = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '';
  }

  // If already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If path already includes /uploads/posts/, use as is
  if (imagePath.includes('/uploads/posts/')) {
    return `${API_BASE_URL.replace('/api', '')}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }

  // If path starts with uploads/posts/ (without leading slash)
  if (imagePath.startsWith('uploads/posts/')) {
    return `${API_BASE_URL.replace('/api', '')}/${imagePath}`;
  }

  // Construct full URL from filename only
  return `${API_BASE_URL.replace('/api', '')}/uploads/posts/${imagePath}`;
};

// Get Video URL
export const getVideoURL = (videoPath: string | null | undefined): string => {
  if (!videoPath) {
    return '';
  }

  // If already a full URL
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    return videoPath;
  }

  // If path already includes /uploads/videos/, use as is
  if (videoPath.includes('/uploads/videos/')) {
    return `${API_BASE_URL.replace('/api', '')}${videoPath.startsWith('/') ? videoPath : '/' + videoPath}`;
  }

  // If path starts with uploads/videos/ (without leading slash)
  if (videoPath.startsWith('uploads/videos/')) {
    return `${API_BASE_URL.replace('/api', '')}/${videoPath}`;
  }

  // Construct full URL from filename only
  return `${API_BASE_URL.replace('/api', '')}/uploads/videos/${videoPath}`;
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

