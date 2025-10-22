import { useState, useEffect, useCallback } from 'react';

// Hook for native-like features
export const useNativeFeatures = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [geolocationSupported, setGeolocationSupported] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  // Check if app is installed as PWA
  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkInstallStatus();
    window.addEventListener('resize', checkInstallStatus);
    return () => window.removeEventListener('resize', checkInstallStatus);
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check feature support
  useEffect(() => {
    setVibrationSupported('vibrate' in navigator);
    setGeolocationSupported('geolocation' in navigator);
    setShareSupported('share' in navigator);
    setClipboardSupported('clipboard' in navigator);
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Vibrate device
  const vibrate = useCallback((pattern = [200, 100, 200]) => {
    if (vibrationSupported) {
      navigator.vibrate(pattern);
    }
  }, [vibrationSupported]);

  // Share content
  const share = useCallback(async (data) => {
    if (shareSupported) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    return false;
  }, [shareSupported]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text) => {
    if (clipboardSupported) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('Copy failed:', error);
        return false;
      }
    }
    return false;
  }, [clipboardSupported]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!geolocationSupported) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }, [geolocationSupported]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Show notification
  const showNotification = useCallback(async (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/Zyea.jpg',
        badge: '/Zyea.jpg',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
    return null;
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  // Wake lock (prevent screen sleep)
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        return wakeLock;
      } catch (error) {
        console.error('Wake lock failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  return {
    isInstalled,
    canInstall,
    installApp,
    vibrate,
    share,
    copyToClipboard,
    getCurrentLocation,
    requestNotificationPermission,
    showNotification,
    toggleFullscreen,
    requestWakeLock,
    vibrationSupported,
    geolocationSupported,
    shareSupported,
    clipboardSupported
  };
};
