import * as ImagePicker from 'expo-image-picker';

export interface ImagePickerResult {
  assets?: Array<{
    uri: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
  }>;
  didCancel?: boolean;
  error?: string;
}

export const launchImageLibrary = async (options?: {
  mediaType?: 'photo' | 'video' | 'mixed';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  selectionLimit?: number;
}): Promise<ImagePickerResult> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      return {
        didCancel: false,
        error: 'Permission denied'
      };
    }

    // Launch image picker
    // Ensure all values are properly typed to avoid boolean/string type mismatch errors
    const selectionLimit = typeof options?.selectionLimit === 'number' 
      ? options.selectionLimit 
      : typeof options?.selectionLimit === 'string' 
      ? parseInt(options.selectionLimit, 10) || 1
      : 1;
    
    const quality = typeof options?.quality === 'number' 
      ? options.quality 
      : typeof options?.quality === 'string' 
      ? parseFloat(options.quality) || 1
      : 1;

    // Use MediaTypeOptions (compatible with expo-image-picker 17.x)
    let mediaTypes: ImagePicker.MediaTypeOptions;
    if (options?.mediaType === 'photo') {
      mediaTypes = ImagePicker.MediaTypeOptions.Images;
    } else if (options?.mediaType === 'video') {
      mediaTypes = ImagePicker.MediaTypeOptions.Videos;
    } else {
      // For 'mixed', use All
      mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypes as any, // Type cast to avoid type errors during migration
      allowsEditing: false,
      quality: Math.max(0, Math.min(1, quality)),
      allowsMultipleSelection: selectionLimit > 1,
      selectionLimit: selectionLimit,
    });

    // Kiểm tra result có tồn tại không
    if (!result) {
      return {
        didCancel: false,
        error: 'Image picker returned no result'
      };
    }

    if (result.canceled) {
      return { didCancel: true };
    }

    // Xử lý an toàn - kiểm tra assets trước khi map
    // Một số version của expo-image-picker có thể trả về 'images' thay vì 'assets'
    let assets: any[] | undefined = undefined;
    try {
      if (result && typeof result === 'object') {
        assets = result.assets;
        if (!assets) {
          assets = (result as any).images;
        }
      }
    } catch (e) {
      console.error('Error accessing assets/images:', e);
    }
    
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return {
        didCancel: false,
        error: 'No assets selected'
      };
    }

    return {
      assets: assets.map((asset: any) => ({
        uri: asset.uri,
        type: asset.type || 'image',
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      }))
    };
  } catch (error: any) {
    // Xử lý lỗi an toàn - không truy cập bất kỳ property nào có thể undefined
    let errorMessage = 'Unknown error';
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch (e) {
      // Nếu không thể extract error message, dùng default
      errorMessage = 'Unknown error';
    }
    
    console.error('Image picker error:', errorMessage);
    return {
      error: errorMessage
    };
  }
};

export const launchCamera = async (options?: {
  mediaType?: 'photo' | 'video';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}): Promise<ImagePickerResult> => {
  try {
    // Request permission
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      return {
        didCancel: false,
        error: 'Permission denied'
      };
    }

    // Launch camera
    // Ensure all values are properly typed to avoid boolean/string type mismatch errors
    const quality = typeof options?.quality === 'number' 
      ? options.quality 
      : typeof options?.quality === 'string' 
      ? parseFloat(options.quality) || 1
      : 1;

    // Use MediaTypeOptions (compatible with expo-image-picker 17.x)
    const mediaTypes = options?.mediaType === 'photo' 
      ? ImagePicker.MediaTypeOptions.Images 
      : ImagePicker.MediaTypeOptions.Videos;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mediaTypes as any, // Type cast to avoid type errors during migration
      allowsEditing: false,
      quality: Math.max(0, Math.min(1, quality)),
    });

    // Kiểm tra result có tồn tại không
    if (!result) {
      return {
        didCancel: false,
        error: 'Camera returned no result'
      };
    }

    if (result.canceled) {
      return { didCancel: true };
    }

    // Xử lý an toàn - kiểm tra assets trước khi map
    // Một số version của expo-image-picker có thể trả về 'images' thay vì 'assets'
    let assets: any[] | undefined = undefined;
    try {
      if (result && typeof result === 'object') {
        assets = result.assets;
        if (!assets) {
          assets = (result as any).images;
        }
      }
    } catch (e) {
      console.error('Error accessing assets/images:', e);
    }
    
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return {
        didCancel: false,
        error: 'No assets selected'
      };
    }

    return {
      assets: assets.map((asset: any) => ({
        uri: asset.uri,
        type: asset.type || 'image',
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      }))
    };
  } catch (error: any) {
    // Xử lý lỗi an toàn - không truy cập bất kỳ property nào có thể undefined
    let errorMessage = 'Unknown error';
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && error.message) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch (e) {
      // Nếu không thể extract error message, dùng default
      errorMessage = 'Unknown error';
    }
    
    console.error('Camera error:', errorMessage);
    return {
      error: errorMessage
    };
  }
};

