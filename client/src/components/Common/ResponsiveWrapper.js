/**
 * Responsive Wrapper Component
 * Initializes and manages responsive enhancements for the entire app
 */

import React, { useEffect } from 'react';
import { initializeResponsiveEnhancements } from '../../utils/responsiveEnhancement';
import { useResponsive } from '../../hooks/useResponsive';

const ResponsiveWrapper = ({ children }) => {
  const { 
    isMobile, 
    isIPhone, 
    isAndroid, 
    viewport, 
    orientation,
    hasNotch,
    hasDynamicIsland,
    safeArea 
  } = useResponsive();

  useEffect(() => {
    // Initialize responsive enhancements
    const cleanup = initializeResponsiveEnhancements();
    
    // Log device info in development
    if (process.env.NODE_ENV === 'development') {
      console.group('📱 Responsive Wrapper Initialized');
      console.log('Mobile:', isMobile);
      console.log('iPhone:', isIPhone);
      console.log('Android:', isAndroid);
      console.log('Viewport:', viewport);
      console.log('Orientation:', orientation);
      console.log('Has Notch:', hasNotch);
      console.log('Has Dynamic Island:', hasDynamicIsland);
      console.log('Safe Area:', safeArea);
      console.groupEnd();
    }
    
    // Add device classes to html element
    const htmlElement = document.documentElement;
    
    // Platform classes
    if (isMobile) htmlElement.classList.add('is-mobile');
    if (isIPhone) htmlElement.classList.add('is-iphone');
    if (isAndroid) htmlElement.classList.add('is-android');
    if (hasNotch) htmlElement.classList.add('has-notch');
    if (hasDynamicIsland) htmlElement.classList.add('has-dynamic-island');
    
    // Orientation class - with safe check
    if (orientation && orientation.isLandscape) {
      htmlElement.classList.add('is-landscape');
    } else {
      htmlElement.classList.add('is-portrait');
    }
    
    // Viewport size classes - with safe check
    if (viewport && viewport.width) {
      if (viewport.width <= 375) htmlElement.classList.add('viewport-xs');
      else if (viewport.width <= 768) htmlElement.classList.add('viewport-sm');
      else if (viewport.width <= 1024) htmlElement.classList.add('viewport-md');
      else htmlElement.classList.add('viewport-lg');
    }
    
    // Cleanup function
    return () => {
      cleanup();
      // Remove classes
      htmlElement.classList.remove('is-mobile', 'is-iphone', 'is-android', 
        'has-notch', 'has-dynamic-island', 'is-landscape', 'is-portrait',
        'viewport-xs', 'viewport-sm', 'viewport-md', 'viewport-lg');
    };
  }, []);
  
  // Update orientation class on change
  useEffect(() => {
    if (!orientation) return;
    
    const htmlElement = document.documentElement;
    
    if (orientation.isLandscape) {
      htmlElement.classList.add('is-landscape');
      htmlElement.classList.remove('is-portrait');
    } else {
      htmlElement.classList.add('is-portrait');
      htmlElement.classList.remove('is-landscape');
    }
  }, [orientation]);
  
  // Update viewport classes on resize
  useEffect(() => {
    if (!viewport || !viewport.width) return;
    
    const htmlElement = document.documentElement;
    
    // Remove all viewport classes
    htmlElement.classList.remove('viewport-xs', 'viewport-sm', 'viewport-md', 'viewport-lg');
    
    // Add current viewport class
    if (viewport.width <= 375) htmlElement.classList.add('viewport-xs');
    else if (viewport.width <= 768) htmlElement.classList.add('viewport-sm');
    else if (viewport.width <= 1024) htmlElement.classList.add('viewport-md');
    else htmlElement.classList.add('viewport-lg');
  }, [viewport]);

  // Don't block rendering, just let it initialize
  return <>{children}</>;
};

export default ResponsiveWrapper;

