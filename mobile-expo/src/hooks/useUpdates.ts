import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { Platform, Alert } from 'react-native';

interface UpdateInfo {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  manifest?: Updates.Manifest;
}

/**
 * Hook để quản lý live updates với Expo Updates
 * 
 * - Tự động check updates khi app mở
 * - Download updates trong background
 * - Yêu cầu restart để apply updates
 */
export function useUpdates() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    isUpdateAvailable: false,
    isUpdatePending: false,
    isChecking: false,
    isDownloading: false,
  });

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      // Development mode hoặc updates không được enable
      return;
    }

    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      setUpdateInfo((prev) => ({ ...prev, isChecking: true }));

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: true,
          manifest: update.manifest,
        }));

        // Tự động download update
        await downloadUpdate();
      } else {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: false,
          isChecking: false,
        }));
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateInfo((prev) => ({ ...prev, isChecking: false }));
    }
  };

  const downloadUpdate = async () => {
    try {
      setUpdateInfo((prev) => ({ ...prev, isDownloading: true }));

      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdatePending: true,
          isDownloading: false,
        }));

        // Hiển thị thông báo có update mới
        Alert.alert(
          'Có phiên bản mới',
          'Đã tải phiên bản mới. Bạn có muốn cập nhật ngay bây giờ?',
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Cập nhật',
              onPress: () => reloadApp(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateInfo((prev) => ({ ...prev, isDownloading: false }));
    }
  };

  const reloadApp = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('Error reloading app:', error);
    }
  };

  return {
    ...updateInfo,
    checkForUpdates,
    reloadApp,
  };
}

