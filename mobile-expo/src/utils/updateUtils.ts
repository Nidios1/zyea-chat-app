import * as Updates from 'expo-updates';

/**
 * Utility functions cho OTA Updates
 */

/**
 * Lấy thông tin về update hiện tại
 */
export const getCurrentUpdateInfo = () => {
  if (!Updates.isEnabled) {
    return {
      isEnabled: false,
      updateId: null,
      createdAt: null,
      runtimeVersion: null,
    };
  }

  return {
    isEnabled: true,
    updateId: Updates.updateId || null,
    createdAt: Updates.createdAt || null,
    runtimeVersion: Updates.runtimeVersion || null,
    channel: Updates.channel || null,
  };
};

/**
 * Kiểm tra xem app có đang chạy update mới nhất không
 */
export const isRunningLatestUpdate = async (): Promise<boolean> => {
  if (__DEV__ || !Updates.isEnabled) {
    return true;
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    return !update.isAvailable;
  } catch (error) {
    console.error('[UpdateUtils] Error checking latest update:', error);
    return true; // Assume latest on error
  }
};

/**
 * Lấy thông tin manifest của update hiện tại
 */
export const getCurrentManifest = (): Updates.Manifest | null => {
  if (!Updates.isEnabled) {
    return null;
  }

  try {
    const manifest = Updates.manifest;
    if (manifest && 'id' in manifest) {
      return manifest as Updates.Manifest;
    }
    return null;
  } catch (error) {
    console.error('[UpdateUtils] Error getting manifest:', error);
    return null;
  }
};

/**
 * Format version string để hiển thị
 */
export const formatUpdateVersion = (updateId: string | null): string => {
  if (!updateId) {
    return 'Unknown';
  }

  // Nếu updateId là timestamp, format thành date
  const timestamp = parseInt(updateId, 10);
  if (!isNaN(timestamp) && timestamp > 1000000000000) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Nếu là hash, lấy 8 ký tự đầu
  if (updateId.length > 8) {
    return updateId.substring(0, 8);
  }

  return updateId;
};

/**
 * Kiểm tra xem có cần force update không
 * (Có thể mở rộng để check từ server)
 */
export const shouldForceUpdate = async (): Promise<boolean> => {
  // TODO: Implement logic để check từ server
  // Ví dụ: Check minimum required version từ API
  return false;
};

