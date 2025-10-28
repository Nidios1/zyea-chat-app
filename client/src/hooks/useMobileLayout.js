/**
 * useMobileLayout - HOOK for Mobile Layout (Web version)
 * 
 * Provides necessary information:
 * - Keyboard height & visibility
 * - Safe area insets
 * - Viewport dimensions
 * - Device info
 * 
 * Usage:
 * const { keyboardHeight, safeAreaTop, safeAreaBottom } = useMobileLayout();
 */

import { useState, useEffect, useCallback } from 'react';

const useMobileLayout = () => {
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Viewport height
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  
  // Safe area insets
  const [safeArea, setSafeArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  // Update viewport height
  const updateViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    setViewportHeight(window.innerHeight);
  }, []);

  // Update keyboard height CSS variable
  const updateKeyboardHeight = useCallback((height) => {
    document.documentElement.style.setProperty('--keyboard-height', `${height}px`);
    setKeyboardHeight(height);
    setIsKeyboardVisible(height > 0);
  }, []);

  // Get safe area insets from CSS
  const updateSafeArea = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const top = parseInt(computedStyle.getPropertyValue('--safe-top') || '0');
    const bottom = parseInt(computedStyle.getPropertyValue('--safe-bottom') || '0');
    const left = parseInt(computedStyle.getPropertyValue('--safe-left') || '0');
    const right = parseInt(computedStyle.getPropertyValue('--safe-right') || '0');
    
    setSafeArea({ top, bottom, left, right });
  }, []);

  // Initialize
  useEffect(() => {
    updateViewportHeight();
    updateSafeArea();
  }, [updateViewportHeight, updateSafeArea]);

  // Handle resize
  useEffect(() => {
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        updateViewportHeight();
        updateSafeArea();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateViewportHeight, updateSafeArea]);

  // Handle keyboard (Web only - visualViewport API)
  useEffect(() => {
    if (window.visualViewport) {
      const handleViewportChange = () => {
        const diff = window.innerHeight - window.visualViewport.height;
        updateKeyboardHeight(diff > 150 ? diff : 0);
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [updateKeyboardHeight]);

  // Hide keyboard programmatically
  const hideKeyboard = useCallback(async () => {
    document.activeElement?.blur();
  }, []);

  return {
    // Keyboard
    keyboardHeight,
    isKeyboardVisible,
    hideKeyboard,
    
    // Safe area
    safeAreaTop: safeArea.top,
    safeAreaBottom: safeArea.bottom,
    safeAreaLeft: safeArea.left,
    safeAreaRight: safeArea.right,
    
    // Viewport
    viewportHeight,
    viewportWidth: window.innerWidth,
    
    // Device
    isNative: false,
    isMobile: window.innerWidth <= 768,
  };
};

export default useMobileLayout;
