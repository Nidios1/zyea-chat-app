/**
 * Init Mobile Layout - SCRIPT DUY NHẤT cho init
 * 
 * Khởi tạo:
 * - Dynamic viewport height (--vh)
 * - Safe area variables
 * - Prevent zoom gestures
 */

// Set dynamic viewport height
export const setViewportHeight = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set safe area variables
export const setSafeArea = () => {
  const root = document.documentElement;
  
  // Get computed safe area values
  const style = getComputedStyle(root);
  const safeTop = style.getPropertyValue('--safe-top') || '0';
  const safeBottom = style.getPropertyValue('--safe-bottom') || '0';
  
  // Log for debugging
  console.log('📱 Safe Area:', {
    top: safeTop,
    bottom: safeBottom,
    width: window.innerWidth,
    height: window.innerHeight,
  });
};

// Prevent double-tap zoom
export const preventZoom = () => {
  let lastTouchEnd = 0;
  
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
};

// Setup resize listeners
export const setupListeners = () => {
  let timeout;
  
  const handleResize = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setViewportHeight();
      setSafeArea();
    }, 100);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
};

// Main init function
export const initMobileLayout = () => {
  console.log('🚀 Initializing mobile layout...');
  
  try {
    setViewportHeight();
    setSafeArea();
    preventZoom();
    setupListeners();
    
    console.log('✅ Mobile layout initialized');
  } catch (error) {
    console.error('❌ Init error:', error);
  }
};

export default initMobileLayout;

