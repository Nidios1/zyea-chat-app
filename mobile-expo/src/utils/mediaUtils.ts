import { Image } from 'react-native';
import { getImageURL, getVideoURL } from './imageUtils';

export interface MediaMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  type: 'image' | 'video';
}

export interface CalculatedDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  displayMode: 'fit' | 'cover' | 'contain';
}

// Cache metadata để tránh load lại
const metadataCache = new Map<string, MediaMetadata>();
const loadingPromises = new Map<string, Promise<MediaMetadata | null>>();

// Đọc metadata của ảnh - với cache để load ngay lập tức nếu đã có
export const getImageMetadata = async (imageUrl: string): Promise<MediaMetadata | null> => {
  try {
    // Kiểm tra URL hợp lệ trước khi gọi getSize
    if (!imageUrl || imageUrl.trim() === '' || imageUrl === 'null' || imageUrl === 'undefined') {
      return null;
    }

    const fullUrl = getImageURL(imageUrl);
    
    // Kiểm tra URL có hợp lệ không
    if (!fullUrl || !fullUrl.startsWith('http')) {
      return null;
    }

    // Kiểm tra cache trước - trả về ngay lập tức nếu đã có
    if (metadataCache.has(imageUrl)) {
      return metadataCache.get(imageUrl)!;
    }

    // Kiểm tra xem đang load chưa - tránh load trùng lặp
    if (loadingPromises.has(imageUrl)) {
      return loadingPromises.get(imageUrl)!;
    }

    // Tạo promise để load metadata
    const loadPromise = new Promise<MediaMetadata | null>((resolve) => {
      // Sử dụng Image.getSize từ react-native
      Image.getSize(
        fullUrl,
        (width, height) => {
          // Kiểm tra kích thước hợp lệ
          if (width > 0 && height > 0) {
            const metadata: MediaMetadata = {
              width,
              height,
              aspectRatio: width / height,
              type: 'image',
            };
            // Lưu vào cache để lần sau load ngay lập tức
            metadataCache.set(imageUrl, metadata);
            resolve(metadata);
          } else {
            resolve(null);
          }
          // Xóa khỏi loading promises sau khi xong
          loadingPromises.delete(imageUrl);
        },
        (error) => {
          // Chỉ log lỗi trong development mode và không log quá nhiều
          if (__DEV__ && Math.random() < 0.1) { // Chỉ log 10% lỗi để tránh spam
            console.warn('Error getting image size:', fullUrl.substring(0, 50) + '...');
          }
          resolve(null);
          // Xóa khỏi loading promises sau khi xong
          loadingPromises.delete(imageUrl);
        }
      );
    });

    // Lưu promise đang load để tránh load trùng lặp
    loadingPromises.set(imageUrl, loadPromise);

    return loadPromise;
  } catch (error) {
    // Chỉ log lỗi trong development mode
    if (__DEV__) {
      console.warn('Error in getImageMetadata:', error);
    }
    return null;
  }
};

// Đọc metadata của video (sử dụng thumbnail hoặc default)
export const getVideoMetadata = async (
  videoUrl: string,
  thumbnailUrl?: string
): Promise<MediaMetadata | null> => {
  try {
    // Nếu có thumbnail, dùng thumbnail để lấy kích thước
    if (thumbnailUrl) {
      const thumbnailMetadata = await getImageMetadata(thumbnailUrl);
      if (thumbnailMetadata) {
        return {
          ...thumbnailMetadata,
          type: 'video',
        };
      }
    }

    // Fallback: giả định video 16:9 (phổ biến nhất)
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
      type: 'video',
    };
  } catch (error) {
    console.warn('Error in getVideoMetadata:', error);
    return null;
  }
};

// Tính toán kích thước hiển thị theo social-app-main pattern
// Giữ nguyên aspect ratio thực tế của ảnh, chỉ constrain nếu quá dọc (< 0.5)
export const calculateDisplayDimensions = (
  metadata: MediaMetadata | null,
  screenWidth: number,
  maxHeight?: number
): CalculatedDimensions => {
  if (!metadata) {
    // Default: 1:1 square
    const defaultSize = Math.min(screenWidth, maxHeight || screenWidth);
    return {
      width: defaultSize,
      height: defaultSize,
      aspectRatio: 1,
      displayMode: 'cover',
    };
  }

  const { width: originalWidth, height: originalHeight, aspectRatio } = metadata;
  
  // social-app-main pattern:
  // - Giữ nguyên aspect ratio thực tế của ảnh
  // - Chỉ constrain nếu aspect ratio < 0.5 (quá dọc, max 1:2 ratio)
  // - Constrain chiều cao tối đa: cho phép ảnh cao hơn để không bị cắt
  //   Tăng maxHeight để ảnh không bị cắt (screenWidth * 2 cho ảnh dọc)
  const defaultMaxHeight = maxHeight || screenWidth * 2; // Cho phép ảnh cao hơn để không bị cắt
  const maxDisplayHeight = defaultMaxHeight;

  let displayWidth = screenWidth;
  let displayHeight: number;
  let displayAspectRatio = aspectRatio;
  let displayMode: 'fit' | 'cover' | 'contain' = 'cover';

  // Constrain aspect ratio: tối thiểu là 0.5 (1:2 ratio) - giống social-app-main
  // social-app-main dùng: constrained = Math.max(aspectRatio, 1/2)
  const minAspectRatio = 1 / 2; // 0.5 (max of 1:2 ratio in feeds)
  if (aspectRatio < minAspectRatio) {
    // Ảnh quá dọc, constrain về 0.5
    displayAspectRatio = minAspectRatio;
  } else {
    // Giữ nguyên aspect ratio thực tế
    displayAspectRatio = aspectRatio;
  }

  // Tính chiều cao dựa trên aspect ratio đã constrain
  displayHeight = displayWidth / displayAspectRatio;

  // Đảm bảo không vượt quá maxHeight (constrain chiều cao tối đa)
  if (displayHeight > maxDisplayHeight) {
    displayHeight = maxDisplayHeight;
    // Khi constrain chiều cao, cập nhật lại aspect ratio thực tế để đảm bảo tính chính xác
    // Điều này đảm bảo aspectRatio trong return value phản ánh đúng kích thước hiển thị
    displayAspectRatio = displayWidth / displayHeight;
  }

  return {
    width: displayWidth,
    height: displayHeight,
    aspectRatio: displayAspectRatio,
    displayMode,
  };
};

// Batch load metadata cho nhiều media
export const loadMediaMetadataBatch = async (
  mediaItems: Array<{ url: string; type: 'image' | 'video'; thumbnail?: string }>
): Promise<Map<string, MediaMetadata>> => {
  const metadataMap = new Map<string, MediaMetadata>();

  const promises = mediaItems.map(async (item) => {
    try {
      let metadata: MediaMetadata | null = null;
      if (item.type === 'image') {
        metadata = await getImageMetadata(item.url);
      } else {
        metadata = await getVideoMetadata(item.url, item.thumbnail);
      }

      if (metadata) {
        metadataMap.set(item.url, metadata);
      }
    } catch (error) {
      console.warn(`Error loading metadata for ${item.url}:`, error);
    }
  });

  await Promise.all(promises);
  return metadataMap;
};

