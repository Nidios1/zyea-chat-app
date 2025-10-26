import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

/**
 * Open Messenger App (Zyea+ Messenger)
 * @param {number} unreadCount - Number of unread messages to pass to messenger
 */
export const openMessengerApp = async (unreadCount = 0) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not a native platform, cannot launch messenger app');
    alert('Chức năng này chỉ hoạt động trên ứng dụng mobile');
    return;
  }

  const platform = Capacitor.getPlatform();
  
  try {
    if (platform === 'android') {
      // Android: Use package name
      const { value } = await AppLauncher.canOpenUrl({ url: 'com.zyea.hieudev' });
      
      if (value) {
        await AppLauncher.openUrl({ 
          url: 'zyeamessenger://open'
        });
        console.log('✅ Opened Messenger app successfully');
      } else {
        alert('Ứng dụng Messenger chưa được cài đặt. Vui lòng cài đặt Zyea+ Messenger.');
        console.log('❌ Messenger app not installed');
      }
    } else if (platform === 'ios') {
      // iOS: Use URL scheme
      const { value } = await AppLauncher.canOpenUrl({ url: 'zyeamessenger://' });
      
      if (value) {
        await AppLauncher.openUrl({ 
          url: 'zyeamessenger://open'
        });
        console.log('✅ Opened Messenger app successfully');
      } else {
        alert('Ứng dụng Messenger chưa được cài đặt. Vui lòng cài đặt Zyea+ Messenger.');
        console.log('❌ Messenger app not installed');
      }
    }
  } catch (error) {
    console.error('Error opening Messenger app:', error);
    alert('Không thể mở ứng dụng Messenger. Vui lòng kiểm tra lại.');
  }
};

/**
 * Check if Messenger app is installed
 */
export const isMessengerInstalled = async () => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'android') {
      const { value } = await AppLauncher.canOpenUrl({ url: 'com.zyea.hieudev' });
      return value;
    } else if (platform === 'ios') {
      const { value } = await AppLauncher.canOpenUrl({ url: 'zyeamessenger://' });
      return value;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking Messenger installation:', error);
    return false;
  }
};

