// Video upload constants
export const MAX_VIDEO_DURATION = 600; // 10 phút (600 giây) - tăng từ 60 giây
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB - tăng từ 100MB
export const MAX_VIDEO_DURATION_MINUTES = MAX_VIDEO_DURATION / 60; // 10 phút

// Format video duration for display
export const formatVideoDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

// Format video size for display
export const formatVideoSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

