import { Capacitor } from '@capacitor/core';

// Detect platform
export const isNative = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isWeb = () => !isNative();

// Check if WebRTC is supported
export const supportsWebRTC = () => {
  // On native iOS/Android, WebRTC works differently
  if (isNative()) {
    // WebRTC is supported on native through Capacitor
    return true;
  }
  // On web, check standard way
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Request media permissions (compatible with both web and native)
export const requestMediaPermissions = async (constraints) => {
  try {
    // On native platforms, getUserMedia works but through Capacitor's WebView
    // iOS automatically shows system permission dialogs
    if (isNative()) {
      // For native, just try to get the stream
      // iOS will automatically show system permission dialog
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { success: true, stream };
    }
    
    // On web, standard getUserMedia
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { success: true, stream };
    
  } catch (error) {
    console.error('Permission error:', error);
    return { 
      success: false, 
      error: error.name,
      message: error.message 
    };
  }
};

// Check if permissions are already granted
export const checkMediaPermissions = async (type = 'camera') => {
  try {
    if (isNative()) {
      // On native, permissions are handled by the OS
      // We can't check beforehand, just try to access
      return { state: 'prompt' };
    }
    
    if (!navigator.permissions) {
      return { state: 'prompt' };
    }
    
    const result = await navigator.permissions.query({ name: type });
    return { state: result.state };
    
  } catch (error) {
    console.error('Error checking permissions:', error);
    return { state: 'prompt' };
  }
};

// Get user media with error handling
export const getUserMedia = async (isVideoCall = true) => {
  try {
    const constraints = {
      video: isVideoCall ? { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };

    // For native platforms
    if (isNative()) {
      console.log('🔵 Native platform detected');
      console.log('   Platform:', Capacitor.getPlatform());
      console.log('   Navigator:', !!navigator);
      console.log('   MediaDevices:', !!navigator.mediaDevices);
      console.log('   getUserMedia:', !!navigator.mediaDevices?.getUserMedia);
      
      // Check if getUserMedia exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = new Error('WebRTC_NOT_CONFIGURED');
        error.name = 'WebRTCNotConfigured';
        error.detail = {
          platform: Capacitor.getPlatform(),
          hasNavigator: !!navigator,
          hasMediaDevices: !!navigator.mediaDevices,
          hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia
        };
        throw error;
      }
      
      console.log('🎥 Requesting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Native stream obtained');
      console.log('   Video tracks:', stream.getVideoTracks().length);
      console.log('   Audio tracks:', stream.getAudioTracks().length);
      return stream;
    }

    // For web
    console.log('🌐 Web platform detected');
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;

  } catch (error) {
    console.error('❌ getUserMedia error:', error);
    console.error('   Name:', error.name);
    console.error('   Message:', error.message);
    console.error('   Detail:', error.detail);
    throw error;
  }
};

// Format error message for display
export const formatMediaError = (error) => {
  if (!error) return 'Unknown error';
  
  let message = '';
  
  // Special handling for WebRTC not configured
  if (error.name === 'WebRTCNotConfigured') {
    if (isIOS()) {
      message = '⚠️ WebRTC Chưa Được Cấu Hình\n\n';
      message += 'App cần rebuild với cấu hình mới:\n\n';
      message += '📋 Developer checklist:\n';
      message += '1. Update capacitor.config.ts\n';
      message += '2. Update AppDelegate.swift\n';
      message += '3. npx cap sync ios\n';
      message += '4. Rebuild IPA\n\n';
      message += 'Chi tiết: Check REBUILD-IPA-FIX.md';
    } else {
      message = '⚠️ WebRTC không khả dụng\n\n';
      message += 'App cần được rebuild với cấu hình WebRTC.';
    }
    return message;
  }
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    if (isIOS()) {
      message = '🔒 Quyền bị từ chối\n\n';
      message += 'Vui lòng:\n';
      message += '1. Vào Settings → Zyea+\n';
      message += '2. Bật Camera và Microphone\n';
      message += '3. Quay lại app và thử lại';
    } else {
      message = '🔒 Quyền bị từ chối\n\n';
      message += 'Vui lòng cho phép truy cập Camera và Microphone trong cài đặt.';
    }
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    message = '📹 Không tìm thấy camera/microphone\n\n';
    message += 'Vui lòng kiểm tra thiết bị.';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    message = '⚠️ Thiết bị đang được sử dụng\n\n';
    message += 'Vui lòng đóng các ứng dụng khác.';
  } else if (error.message && error.message.includes('WebRTC')) {
    message = '⚠️ WebRTC Không Khả Dụng\n\n';
    message += 'App cần rebuild với:\n';
    message += '- capacitor.config.ts updated\n';
    message += '- AppDelegate.swift updated\n';
    message += '- iOS native config\n\n';
    message += 'Xem: REBUILD-IPA-FIX.md';
  } else if (error.message) {
    message = '❌ Lỗi: ' + error.message;
  } else {
    message = '❌ Không thể truy cập camera/microphone';
  }
  
  return message;
};

