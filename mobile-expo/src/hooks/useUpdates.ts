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
    // Skip trong development mode
    if (__DEV__) {
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: 'OTA Updates không khả dụng trong chế độ development',
      }));
      return;
    }

    // Kiểm tra Updates có enabled không
    if (!Updates.isEnabled) {
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: 'OTA Updates không được bật trong ứng dụng này',
      }));
      return;
    }

    // Kiểm tra channel và runtimeVersion trước khi check updates
    const channel = Updates.channel;
    const runtimeVersion = Updates.runtimeVersion;
    const currentUpdateId = Updates.updateId;

    // Nếu app đã có Update ID, nghĩa là đã được build với EAS Build
    // Không cần check channel nữa vì app đã có update embedded
    if (currentUpdateId) {
      // App đã được build với EAS Build, có thể có hoặc không có channel
      // Nhưng vẫn có thể check update
      console.log('✅ App has Update ID, proceeding with update check...', {
        updateId: currentUpdateId,
        channel: channel || 'default',
        runtimeVersion: runtimeVersion || 'unknown',
      });
    } else if (!channel) {
      // Chỉ báo lỗi nếu không có Update ID VÀ không có channel
      const errorMsg = 'Channel chưa được cấu hình. Ứng dụng cần được build lại với EAS Build và channel đã được cấu hình trong eas.json.';
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: errorMsg,
      }));
      console.warn('⚠️ Channel not found. App needs to be built with EAS Build and channel configuration.');
      return;
    }

    // Kiểm tra runtimeVersion - cần thiết cho EAS Update
    // Nhưng nếu đã có Update ID, có thể bỏ qua check này
    if (!runtimeVersion && !currentUpdateId) {
      const errorMsg = 'Runtime version chưa được cấu hình. Vui lòng kiểm tra lại cấu hình trong app.json (runtimeVersion policy).';
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: errorMsg,
      }));
      console.warn('⚠️ Runtime version not found. Check app.json runtimeVersion configuration.');
      return;
    }

    try {
      // Clear error nếu app đã có Update ID (đã được build với EAS Build)
      // Điều này đảm bảo không hiển thị cảnh báo channel nếu app đã được build đúng cách
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: true,
        error: currentUpdateId && prev.error?.includes('Channel chưa được cấu hình') ? null : prev.error,
      }));

      console.log('🔍 Checking for updates...', {
        channel,
        runtimeVersion,
        updateId: Updates.updateId,
      });

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        const newVersion = update.manifest?.id || null;
        
        console.log('✅ Update available:', newVersion);
        
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
        console.log('ℹ️ No update available');
        setUpdateInfo((prev) => ({
          ...prev,
          isUpdateAvailable: false,
          isChecking: false,
          error: null,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('❌ Error checking for updates:', error);
      
      // Xử lý lỗi thiếu channel/headers một cách đặc biệt
      let userFriendlyError = errorMessage;
      
      if (errorMessage.includes('channel-name') || errorMessage.includes('channelName')) {
        userFriendlyError = 'Channel chưa được cấu hình. Ứng dụng cần được build lại với EAS Build và channel đã được cấu hình trong eas.json.';
      } else if (errorMessage.includes('runtime-version') || errorMessage.includes('runtimeVersion')) {
        userFriendlyError = 'Runtime version chưa được cấu hình. Vui lòng kiểm tra lại cấu hình trong app.json (runtimeVersion policy).';
      } else if (errorMessage.includes('400')) {
        userFriendlyError = 'Lỗi cấu hình update server. Có thể do thiếu channel hoặc runtime version. Vui lòng build lại app với EAS Build.';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userFriendlyError = 'Lỗi xác thực. Vui lòng kiểm tra lại EAS project configuration.';
      } else if (errorMessage.includes('404')) {
        userFriendlyError = 'Không tìm thấy update server. Vui lòng kiểm tra lại cấu hình trong app.json.';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        userFriendlyError = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối internet.';
      }
      
      setUpdateInfo((prev) => ({
        ...prev,
        isChecking: false,
        error: userFriendlyError,
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

