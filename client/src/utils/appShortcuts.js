/**
 * App Shortcuts & Deep Linking (Web version)
 * Quick actions and URL handling
 */

// Initialize deep linking (no-op for web)
export const initDeepLinking = (onDeepLink) => {
  console.log('ℹ️ Deep linking only available on native platforms');
  return null;
};

// Handle deep link routes
export const handleDeepLink = (path, params, navigate) => {
  console.log('🔗 Handling deep link:', path, params);

  // Remove scheme and host from path
  const cleanPath = path.replace(/^.*:\/\/[^/]+/, '');

  switch (cleanPath) {
    case '/chat':
      if (params.userId) {
        navigate(`/chat/${params.userId}`);
      } else {
        navigate('/');
      }
      break;

    case '/profile':
      if (params.userId) {
        navigate(`/profile/${params.userId}`);
      } else {
        navigate('/profile');
      }
      break;

    case '/newsfeed':
      navigate('/newsfeed');
      break;

    case '/friends':
      navigate('/friends');
      break;

    case '/post':
      if (params.postId) {
        navigate(`/post/${params.postId}`);
      }
      break;

    case '/notifications':
      navigate('/notifications');
      break;

    default:
      navigate('/');
  }
};

// App Shortcuts Configuration (Android) - no-op for web
export const setupAndroidShortcuts = async () => {
  return [];
};

// iOS Quick Actions - no-op for web
export const setupIOSQuickActions = async () => {
  return [];
};

// Generate shareable deep link
export const generateDeepLink = (path, params = {}) => {
  const baseUrl = 'zyea://app';
  const queryString = new URLSearchParams(params).toString();
  
  return queryString 
    ? `${baseUrl}${path}?${queryString}`
    : `${baseUrl}${path}`;
};

// Generate universal link (for web fallback)
export const generateUniversalLink = (path, params = {}) => {
  const baseUrl = window.location.origin; // Use current origin
  const queryString = new URLSearchParams(params).toString();
  
  return queryString 
    ? `${baseUrl}${path}?${queryString}`
    : `${baseUrl}${path}`;
};

// Share deep link
export const shareDeepLink = async (path, params = {}, options = {}) => {
  const deepLink = generateDeepLink(path, params);
  const universalLink = generateUniversalLink(path, params);

  // Web share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title || 'Zyea+',
        text: options.text || 'Xem trên Zyea+',
        url: universalLink
      });
      return true;
    } catch (error) {
      console.error('Share error:', error);
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(universalLink);
      alert('Đã copy link!');
      return true;
    } catch (error) {
      console.error('Copy error:', error);
      return false;
    }
  }
};

// Open external URL
export const openExternalUrl = async (url) => {
  window.open(url, '_blank');
};

// Check if can open app (always false for web)
export const canOpenApp = async (appUrl) => {
  return false;
};

// Open other app (no-op for web)
export const openApp = async (appUrl) => {
  console.log('ℹ️ Opening apps only available on native platforms');
  return false;
};

export default {
  initDeepLinking,
  handleDeepLink,
  setupAndroidShortcuts,
  setupIOSQuickActions,
  generateDeepLink,
  generateUniversalLink,
  shareDeepLink,
  openExternalUrl,
  canOpenApp,
  openApp
};
