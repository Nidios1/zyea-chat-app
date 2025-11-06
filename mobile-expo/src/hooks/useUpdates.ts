import { useEffect, useState, useCallback, useRef } from 'react';
import * as Updates from 'expo-updates';
import { AppState, AppStateStatus } from 'react-native';

interface UpdateInfo {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  showUpdateModal: boolean;
  downloadProgress: number;
  error: string | null;
  currentVersion: string | null;
  newVersion: string | null;
  manifest?: Updates.Manifest;
}

interface UseUpdatesOptions {
  checkOnMount?: boolean;
  checkInterval?: number; // milliseconds
  autoDownload?: boolean;
}

/**
 * Hook để quản lý live updates với Expo Updates
 * 
 * Tính năng:
 * - Tự động check updates khi app mở
 * - Check updates định kỳ khi app ở foreground
 * - Download updates trong background với progress tracking
 * - Error handling và retry logic
 * - Yêu cầu restart để apply updates
 */
export function useUpdates(options: UseUpdatesOptions = {}) {
  const {
    checkOnMount = true,
    checkInterval = 5 * 60 * 1000, // 5 phút
    autoDownload = true,
  } = options;

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    isUpdateAvailable: false,
    isUpdatePending: false,
    isChecking: false,
    isDownloading: false,
    showUpdateModal: false,
    downloadProgress: 0,
    error: null,
    currentVersion: Updates.updateId || null,
    newVersion: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Lấy thông tin version hiện tại
  useEffect(() => {
    if (Updates.isEnabled) {
      const currentUpdateId = Updates.updateId;
      setUpdateInfo((prev) => ({
        ...prev,
        currentVersion: currentUpdateId || null,
      }));
    }
  }, []);

  // Check updates khi mount
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) {
      console.log('[OTA Updates] Disabled in development mode or not enabled');
      return;
    }

    if (checkOnMount) {
      checkForUpdates();
    }

    // Setup interval để check định kỳ
    if (checkInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (appStateRef.current === 'active') {
          checkForUpdates();
        }
      }, checkInterval);
    }

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, check for updates
        checkForUpdates();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.remove();
    };
  }, [checkOnMount, checkInterval]);

  const checkForUpdates = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    try {
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: true,
        error: null,
      }));

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        const newVersion = update.manifest?.id || null;
        
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: true,
          manifest: update.manifest,
          newVersion,
          isChecking: false,
        }));

        // Tự động download nếu được bật
        if (autoDownload) {
          await downloadUpdate();
        } else {
          // Nếu không auto download, vẫn hiển thị modal để user chọn
          setUpdateInfo((prev) => ({
            ...prev,
            showUpdateModal: true,
          }));
        }
      } else {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: false,
          isChecking: false,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OTA Updates] Error checking for updates:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: `Không thể kiểm tra cập nhật: ${errorMessage}`,
      }));
    }
  }, [autoDownload]);

  const downloadUpdate = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    try {
      setUpdateInfo((prev) => ({
        ...prev,
        isDownloading: true,
        downloadProgress: 0,
        error: null,
      }));

      // Note: expo-updates không hỗ trợ progress callback trực tiếp
      // Có thể implement bằng cách estimate dựa trên thời gian
      const startTime = Date.now();
      
      const result = await Updates.fetchUpdateAsync();
      const downloadTime = Date.now() - startTime;

      if (result.isNew) {
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdatePending: true,
          isDownloading: false,
          downloadProgress: 100,
          showUpdateModal: true,
        }));
      } else {
        setUpdateInfo((prev) => ({
          ...prev,
          isDownloading: false,
          downloadProgress: 0,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[OTA Updates] Error downloading update:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        isDownloading: false,
        downloadProgress: 0,
        error: `Không thể tải cập nhật: ${errorMessage}`,
      }));
    }
  }, []);

  const reloadApp = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error('[OTA Updates] Error reloading app:', error);
      setUpdateInfo((prev) => ({
        ...prev,
        error: 'Không thể khởi động lại ứng dụng',
      }));
    }
  }, []);

  const handleUpdate = useCallback(() => {
    setUpdateInfo((prev) => ({ ...prev, showUpdateModal: false }));
    reloadApp();
  }, [reloadApp]);

  const handleCancel = useCallback(() => {
    setUpdateInfo((prev) => ({ ...prev, showUpdateModal: false }));
  }, []);

  const handleRetry = useCallback(() => {
    setUpdateInfo((prev) => ({ ...prev, error: null }));
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    ...updateInfo,
    checkForUpdates,
    downloadUpdate,
    reloadApp,
    handleUpdate,
    handleCancel,
    handleRetry,
  };
}

