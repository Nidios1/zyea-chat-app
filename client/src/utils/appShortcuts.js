import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * App Shortcuts & Deep Linking
 * Quick actions from home screen and URL handling
 */

// Initialize deep linking
export const initDeepLinking = (onDeepLink) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('ℹ️ Deep linking only available on native platforms');
    return null;
  }

  // Listen for app URL open
  const listener = App.addListener('appUrlOpen', (data) => {
    console.log('🔗 App opened with URL:', data.url);
    
    const url = new URL(data.url);
    const path = url.pathname;
    const params = Object.fromEntries(url.searchParams);

    if (onDeepLink) {
      onDeepLink({ path, params, url: data.url });
    }
  });

  // Check if app was launched with URL
  App.getLaunchUrl().then(result => {
    if (result && result.url) {
      console.log('🚀 App launched with URL:', result.url);
      
      const url = new URL(result.url);
      const path = url.pathname;
      const params = Object.fromEntries(url.searchParams);

      if (onDeepLink) {
        onDeepLink({ path, params, url: result.url });
      }
    }
  });

  return listener;
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

// App Shortcuts Configuration (Android)
export const setupAndroidShortcuts = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }

  // Note: This requires native Android code in MainActivity.java
  // Add shortcuts in AndroidManifest.xml
  console.log('📱 Android shortcuts should be configured in AndroidManifest.xml');
  
  // Example shortcuts that can be added:
  const shortcuts = [
    {
      id: 'new_message',
      shortLabel: 'Tin nhắn mới',
      longLabel: 'Gửi tin nhắn mới',
      icon: '@mipmap/ic_message',
      action: 'com.zyea.hieudev.NEW_MESSAGE'
    },
    {
      id: 'new_post',
      shortLabel: 'Bài viết mới',
      longLabel: 'Tạo bài viết mới',
      icon: '@mipmap/ic_post',
      action: 'com.zyea.hieudev.NEW_POST'
    },
    {
      id: 'scan_qr',
      shortLabel: 'Quét QR',
      longLabel: 'Quét mã QR',
      icon: '@mipmap/ic_qr',
      action: 'com.zyea.hieudev.SCAN_QR'
    }
  ];

  return shortcuts;
};

// iOS Quick Actions (3D Touch / Haptic Touch)
export const setupIOSQuickActions = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return;
  }

  // Note: This requires native iOS code in AppDelegate.swift
  console.log('📱 iOS quick actions should be configured in Info.plist');

  // Example quick actions that can be added:
  const quickActions = [
    {
      type: 'NewMessage',
      title: 'Tin nhắn mới',
      subtitle: 'Gửi tin nhắn nhanh',
      icon: 'UIApplicationShortcutIconTypeCompose'
    },
    {
      type: 'NewPost',
      title: 'Bài viết mới',
      subtitle: 'Tạo bài viết mới',
      icon: 'UIApplicationShortcutIconTypeAdd'
    },
    {
      type: 'ScanQR',
      title: 'Quét QR',
      subtitle: 'Quét mã QR',
      icon: 'UIApplicationShortcutIconTypeSearch'
    },
    {
      type: 'MyProfile',
      title: 'Trang cá nhân',
      subtitle: 'Xem trang của tôi',
      icon: 'UIApplicationShortcutIconTypeContact'
    }
  ];

  return quickActions;
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
  const baseUrl = 'https://zyea.app'; // Replace with your actual domain
  const queryString = new URLSearchParams(params).toString();
  
  return queryString 
    ? `${baseUrl}${path}?${queryString}`
    : `${baseUrl}${path}`;
};

// Share deep link
export const shareDeepLink = async (path, params = {}, options = {}) => {
  const deepLink = generateDeepLink(path, params);
  const universalLink = generateUniversalLink(path, params);

  if (!Capacitor.isNativePlatform()) {
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
  }

  // Native share
  try {
    const { Share } = await import('@capacitor/share');
    
    await Share.share({
      title: options.title || 'Zyea+',
      text: options.text || 'Xem trên Zyea+',
      url: universalLink,
      dialogTitle: 'Chia sẻ'
    });
    
    return true;
  } catch (error) {
    console.error('Native share error:', error);
    return false;
  }
};

// Open external URL
export const openExternalUrl = async (url) => {
  if (!Capacitor.isNativePlatform()) {
    window.open(url, '_blank');
    return;
  }

  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch (error) {
    console.error('Open URL error:', error);
    window.open(url, '_blank');
  }
};

// Check if can open app
export const canOpenApp = async (appUrl) => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const { AppLauncher } = await import('@capacitor/app-launcher');
    const result = await AppLauncher.canOpenUrl({ url: appUrl });
    return result.value;
  } catch (error) {
    console.error('Can open app error:', error);
    return false;
  }
};

// Open other app
export const openApp = async (appUrl) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('ℹ️ Opening apps only available on native platforms');
    return false;
  }

  try {
    const { AppLauncher } = await import('@capacitor/app-launcher');
    await AppLauncher.openUrl({ url: appUrl });
    return true;
  } catch (error) {
    console.error('Open app error:', error);
    return false;
  }
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

