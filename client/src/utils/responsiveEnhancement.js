/**
 * Advanced Responsive Enhancement Utilities
 * Handles dynamic viewport, keyboard resize, orientation, and device-specific optimizations
 */

/**
 * Dynamic viewport height that accounts for mobile browser chrome
 * Updates CSS custom property --vh for accurate 100vh
 */
export const initDynamicViewportHeight = () => {
  const setViewportHeight = () => {
    // Get actual viewport height (excluding browser chrome)
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Also set viewport width
    const vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--vw', `${vw}px`);
  };

  // Set on init
  setViewportHeight();

  // Update on resize and orientation change
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', () => {
    // Delay to let the browser finish the orientation change
    setTimeout(setViewportHeight, 100);
  });

  // Visual viewport API for better keyboard handling
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportHeight);
    window.visualViewport.addEventListener('scroll', setViewportHeight);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', setViewportHeight);
      window.visualViewport.removeEventListener('scroll', setViewportHeight);
    }
  };
};

/**
 * Handle keyboard show/hide on mobile devices
 * Returns object with keyboard state and height
 */
export const initKeyboardHandler = () => {
  let keyboardState = {
    isVisible: false,
    height: 0,
    visualViewportHeight: window.innerHeight,
  };

  const handleKeyboardChange = () => {
    if (!window.visualViewport) return;

    const currentHeight = window.visualViewport.height;
    const isKeyboardVisible = currentHeight < window.innerHeight;
    const keyboardHeight = isKeyboardVisible ? window.innerHeight - currentHeight : 0;

    keyboardState = {
      isVisible: isKeyboardVisible,
      height: keyboardHeight,
      visualViewportHeight: currentHeight,
    };

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('keyboardchange', {
      detail: keyboardState
    }));

    // Update CSS custom property
    document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    document.documentElement.classList.toggle('keyboard-visible', isKeyboardVisible);
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleKeyboardChange);
    window.visualViewport.addEventListener('scroll', handleKeyboardChange);
  }

  // Fallback for older browsers
  window.addEventListener('resize', handleKeyboardChange);

  return {
    getState: () => keyboardState,
    cleanup: () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleKeyboardChange);
        window.visualViewport.removeEventListener('scroll', handleKeyboardChange);
      }
      window.removeEventListener('resize', handleKeyboardChange);
    }
  };
};

/**
 * Prevent zoom on input focus (iOS)
 */
export const preventInputZoom = () => {
  // Add viewport-fit and prevent zoom
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const content = viewport.getAttribute('content');
    if (!content.includes('maximum-scale=1')) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }
  
  // Ensure all inputs have minimum font-size of 16px
  const style = document.createElement('style');
  style.textContent = `
    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="search"],
    input[type="tel"],
    input[type="url"],
    textarea,
    select {
      font-size: 16px !important;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Initialize all responsive enhancements
 */
export const initializeResponsiveEnhancements = () => {
  console.log('🎨 Initializing responsive enhancements...');
  
  // 1. Dynamic viewport height
  const cleanupVH = initDynamicViewportHeight();
  
  // 2. Keyboard handler
  const keyboard = initKeyboardHandler();
  
  // 3. Prevent input zoom on iOS
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    preventInputZoom();
  }
  
  // 4. Add responsive class to html
  document.documentElement.classList.add('responsive-enhanced');
  
  // 5. Log device info
  console.log('📱 Device info:', {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    dpr: window.devicePixelRatio,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    canHover: window.matchMedia('(hover: hover) and (pointer: fine)').matches
  });
  
  // Return cleanup function
  return () => {
    cleanupVH();
    keyboard.cleanup();
    document.documentElement.classList.remove('responsive-enhanced');
  };
};

// Export all utilities
export default {
  initDynamicViewportHeight,
  initKeyboardHandler,
  preventInputZoom,
  initializeResponsiveEnhancements
};
