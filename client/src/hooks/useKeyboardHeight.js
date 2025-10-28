import { useState, useEffect } from 'react';

/**
 * Hook to track keyboard height on web apps
 * Automatically adjusts UI when keyboard appears/disappears
 */
export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) {
      return;
    }

    const handleResize = () => {
      const currentHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - currentHeight;
      
      if (heightDiff > 100) {
        setKeyboardHeight(heightDiff);
        setIsKeyboardVisible(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport.removeEventListener('resize', handleResize);
      window.visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    keyboardOffset: keyboardHeight
  };
};

/**
 * Hook to manage scroll behavior when keyboard appears
 */
export const useKeyboardScroll = (inputRef, enabled = true) => {
  const { isKeyboardVisible, keyboardHeight } = useKeyboardHeight();

  useEffect(() => {
    if (!enabled) return;

    if (isKeyboardVisible && inputRef.current) {
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
