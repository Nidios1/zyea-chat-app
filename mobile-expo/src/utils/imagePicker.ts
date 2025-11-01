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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options?.mediaType === 'photo' 
        ? ImagePicker.MediaTypeOptions.Images 
        : options?.mediaType === 'video'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All,
      allowsEditing: false as boolean,
      quality: Math.max(0, Math.min(1, quality)),
      allowsMultipleSelection: (selectionLimit > 1) as boolean,
      selectionLimit: selectionLimit,
    });

    if (result.canceled) {
      return { didCancel: true };
    }

    return {
      assets: result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image',
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      }))
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
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

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: options?.mediaType === 'photo' 
        ? ImagePicker.MediaTypeOptions.Images 
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false as boolean,
      quality: Math.max(0, Math.min(1, quality)),
    });

    if (result.canceled) {
      return { didCancel: true };
    }

    return {
      assets: result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type || 'image',
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      }))
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

