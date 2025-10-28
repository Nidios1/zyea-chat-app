/**
 * Keyboard Hook for Web Apps
 * Handles keyboard show/hide events using visualViewport API
 */

import { useState, useEffect, useCallback } from 'react';

export const useKeyboard = () => {
  const [keyboardInfo, setKeyboardInfo] = useState({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
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
  }, []);

  // Show keyboard programmatically
  const showKeyboard = useCallback(async () => {
    // Focus on any focused element
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.focus();
    }
  }, []);

  // Hide keyboard programmatically
  const hideKeyboard = useCallback(async () => {
    // Blur active element
    if (document.activeElement) {
      document.activeElement.blur();
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
