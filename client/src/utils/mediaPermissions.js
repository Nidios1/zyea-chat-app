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
      console.log('🔵 Native platform detected, using native getUserMedia');
      
      // Check if getUserMedia exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC not available in this WebView configuration');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Native stream obtained:', stream);
      return stream;
    }

    // For web
    console.log('🌐 Web platform detected');
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;

  } catch (error) {
    console.error('❌ getUserMedia error:', error);
    throw error;
  }
};

// Format error message for display
export const formatMediaError = (error) => {
  if (!error) return 'Unknown error';
  
  let message = '';
  
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
  } else if (error.message) {
    message = '❌ Lỗi: ' + error.message;
  } else {
    message = '❌ Không thể truy cập camera/microphone';
  }
  
  return message;
};

