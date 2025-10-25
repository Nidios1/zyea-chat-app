/**
 * Keyboard Hook for Native Apps
 * Handles keyboard show/hide events on Capacitor iOS/Android
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

export const useKeyboard = () => {
  const [keyboardInfo, setKeyboardInfo] = useState({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      // PWA: Use visualViewport for keyboard detection
      if (window.visualViewport) {
        const handleResize = () => {
          const currentHeight = window.visualViewport.height;
          const isKeyboardVisible = currentHeight < window.innerHeight;
          const keyboardHeight = isKeyboardVisible ? window.innerHeight - currentHeight : 0;
          
          setKeyboardInfo({
            isVisible: isKeyboardVisible,
            height: keyboardHeight,
          });
        };

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);

        return () => {
          window.visualViewport.removeEventListener('resize', handleResize);
          window.visualViewport.removeEventListener('scroll', handleResize);
        };
      }
      return;
    }

    // Native: Use Capacitor Keyboard plugin
    let keyboardShowListener;
    let keyboardHideListener;
    let keyboardWillShowListener;
    let keyboardWillHideListener;

    const setupKeyboardListeners = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');

        // Keyboard will show (get height before it appears)
        keyboardWillShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          console.log('🎹 Keyboard will show:', info.keyboardHeight);
          setKeyboardInfo({
            isVisible: true,
            height: info.keyboardHeight,
          });
        });

        // Keyboard shown
        keyboardShowListener = await Keyboard.addListener('keyboardDidShow', (info) => {
          console.log('🎹 Keyboard shown:', info.keyboardHeight);
          setKeyboardInfo({
            isVisible: true,
            height: info.keyboardHeight,
          });
        });

        // Keyboard will hide
        keyboardWillHideListener = await Keyboard.addListener('keyboardWillHide', () => {
          console.log('🎹 Keyboard will hide');
          setKeyboardInfo({
            isVisible: false,
            height: 0,
          });
        });

        // Keyboard hidden
        keyboardHideListener = await Keyboard.addListener('keyboardDidHide', () => {
          console.log('🎹 Keyboard hidden');
          setKeyboardInfo({
            isVisible: false,
            height: 0,
          });
        });

        // Set keyboard style (iOS)
        if (Capacitor.getPlatform() === 'ios') {
          await Keyboard.setStyle({ style: 'DARK' });
        }

        // Configure keyboard behavior
        await Keyboard.setAccessoryBarVisible({ isVisible: true });
        await Keyboard.setScroll({ isDisabled: false });

        console.log('✅ Keyboard listeners setup');
      } catch (error) {
        console.error('❌ Error setting up keyboard listeners:', error);
      }
    };

    setupKeyboardListeners();

    // Cleanup
    return () => {
      if (keyboardShowListener) keyboardShowListener.remove();
      if (keyboardHideListener) keyboardHideListener.remove();
      if (keyboardWillShowListener) keyboardWillShowListener.remove();
      if (keyboardWillHideListener) keyboardWillHideListener.remove();
    };
  }, []);

  // Show keyboard programmatically
  const showKeyboard = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.show();
    } catch (error) {
      console.error('Error showing keyboard:', error);
    }
  }, []);

  // Hide keyboard programmatically
  const hideKeyboard = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.hide();
    } catch (error) {
      console.error('Error hiding keyboard:', error);
    }
  }, []);

  return {
    isKeyboardVisible: keyboardInfo.isVisible,
    keyboardHeight: keyboardInfo.height,
    showKeyboard,
    hideKeyboard,
  };
};

export default useKeyboard;

