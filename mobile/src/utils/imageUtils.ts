import { API_BASE_URL } from '../config/constants';

// Globe Avatar URL
export const getAvatarURL = (avatarPath: string | null | undefined): string => {
  if (!avatarPath) {
    return '';
  }

  // If already a full URL
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Construct full URL
  return `${API_BASE_URL.replace('/api', '')}/uploads/avatars/${avatarPath}`;
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

  // Construct full URL
  return `${API_BASE_URL.replace('/api', '')}/uploads/posts/${imagePath}`;
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

