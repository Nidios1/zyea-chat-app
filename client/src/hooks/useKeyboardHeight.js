import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to track keyboard height on native apps
 * Automatically adjusts UI when keyboard appears/disappears
 */
export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Running on web - keyboard height tracking disabled');
      return;
    }

    let Keyboard;
    let showListener;
    let hideListener;

    const setupKeyboardListeners = async () => {
      try {
        // Import Capacitor Keyboard plugin
        const { Keyboard: KeyboardPlugin } = await import('@capacitor/keyboard');
        Keyboard = KeyboardPlugin;

        console.log('⌨️ Setting up keyboard listeners (Native)');

        // Listen for keyboard show
        showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          console.log('⌨️ Keyboard will show:', info.keyboardHeight);
          setKeyboardHeight(info.keyboardHeight);
          setIsKeyboardVisible(true);
        });

        // Also listen to keyboardDidShow for backup
        const didShowListener = await Keyboard.addListener('keyboardDidShow', (info) => {
          console.log('⌨️ Keyboard did show:', info.keyboardHeight);
          setKeyboardHeight(info.keyboardHeight);
          setIsKeyboardVisible(true);
        });

        // Listen for keyboard hide
        hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          console.log('⌨️ Keyboard will hide');
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        });

        // Also listen to keyboardDidHide for backup
        const didHideListener = await Keyboard.addListener('keyboardDidHide', () => {
          console.log('⌨️ Keyboard did hide');
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        });

        console.log('✅ Keyboard listeners set up successfully');

        // Return cleanup function
        return () => {
          showListener?.remove();
          hideListener?.remove();
          didShowListener?.remove();
          didHideListener?.remove();
        };
      } catch (error) {
        console.error('❌ Error setting up keyboard listeners:', error);
        // Fallback: use viewport height changes
        console.log('⚠️ Using viewport fallback for keyboard detection');
        setupViewportFallback();
      }
    };

    // Fallback method using window resize
    const setupViewportFallback = () => {
      let initialHeight = window.innerHeight;

      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;

        // If viewport shrunk by more than 150px, keyboard is probably open
        if (heightDiff > 150) {
          console.log('⌨️ Keyboard detected (viewport method):', heightDiff);
          setKeyboardHeight(heightDiff);
          setIsKeyboardVisible(true);
        } else if (heightDiff < 50) {
          console.log('⌨️ Keyboard hidden (viewport method)');
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }
      };

      window.addEventListener('resize', handleResize);
      window.visualViewport?.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    };

    // Setup listeners
    const cleanup = setupKeyboardListeners();

    // Cleanup on unmount
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (cleanupFn) cleanupFn();
        });
      }
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    // For backward compatibility
    keyboardOffset: keyboardHeight
  };
};

/**
 * Hook to manage scroll behavior when keyboard appears
 * Automatically scrolls input field into view
 */
export const useKeyboardScroll = (inputRef, enabled = true) => {
  const { isKeyboardVisible, keyboardHeight } = useKeyboardHeight();

  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;

    if (isKeyboardVisible && inputRef.current) {
      console.log('📜 Scrolling input into view');
      
      // Wait for keyboard animation to complete
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [isKeyboardVisible, inputRef, enabled]);

  return { isKeyboardVisible, keyboardHeight };
};

export default useKeyboardHeight;

