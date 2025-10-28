// Media permissions utilities for web

// Detect platform
export const isNative = () => false;
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
export const isAndroid = () => /Android/.test(navigator.userAgent);
export const isWeb = () => true;

// Check if WebRTC is supported
export const supportsWebRTC = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// Request media permissions
export const requestMediaPermissions = async (constraints) => {
  try {
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

    console.log('🌐 Web platform detected');
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('❌ getUserMedia error:', error);
    console.error('   Name:', error.name);
    console.error('   Message:', error.message);
    throw error;
  }
};

// Format error message for display
export const formatMediaError = (error) => {
  if (!error) return 'Unknown error';
  
  let message = '';
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    message = '🔒 Quyền bị từ chối\n\n';
    message += 'Vui lòng cho phép truy cập Camera và Microphone trong cài đặt.';
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
