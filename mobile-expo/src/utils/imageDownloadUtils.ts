import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Utility functions for downloading images before saving/sharing
 * Similar to social-app-main's implementation
 */

/**
 * Normalize path for Android (add file:// prefix if needed)
 */
function normalizePath(str: string): string {
  if (Platform.OS === 'android') {
    if (!str.startsWith('file://')) {
      return `file://${str}`;
    }
  }
  return str;
}

/**
 * Create a temporary file path for downloading images
 */
export function createImagePath(ext: string = 'jpg'): string {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  return `${FileSystem.cacheDirectory}${filename}`;
}

/**
 * Download image from URI to local path
 * @param uri - Remote image URI
 * @param path - Local path to save the image
 * @param timeout - Timeout in milliseconds (default: 15 seconds)
 */
export async function downloadImage(
  uri: string,
  path: string,
  timeout: number = 15000,
): Promise<string> {
  try {
    const downloadResumable = FileSystem.createDownloadResumable(uri, path, {
      cache: true,
    });

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      downloadResumable.cancelAsync();
    }, timeout);

    const downloadResult = await downloadResumable.downloadAsync();
    clearTimeout(timeoutId);

    if (!downloadResult?.uri) {
      if (timedOut) {
        throw new Error('Failed to download image - timed out');
      } else {
        throw new Error('Failed to download image - download result is undefined');
      }
    }

    return normalizePath(downloadResult.uri);
  } catch (error: any) {
    // Clean up on error
    try {
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Move file to permanent path (copy to cache directory with new name)
 */
export async function moveToPermanentPath(
  path: string,
  ext: string = '.jpg',
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
  const destinationPath = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.copyAsync({
    from: normalizePath(path),
    to: normalizePath(destinationPath),
  });

  // Delete original file
  try {
    await FileSystem.deleteAsync(normalizePath(path), { idempotent: true });
  } catch (error) {
    // Ignore deletion errors
  }

  return normalizePath(destinationPath);
}

/**
 * Safe delete file (with error handling)
 */
export async function safeDeleteAsync(path: string): Promise<void> {
  try {
    const normalizedPath = normalizePath(path);
    const fileInfo = await FileSystem.getInfoAsync(normalizedPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(normalizedPath, { idempotent: true });
    }
  } catch (error) {
    // Ignore deletion errors
    console.log('Failed to delete file:', path, error);
  }
}

