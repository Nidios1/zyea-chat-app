/**
 * Responsive utility functions for iPhone and mobile optimization
 */

// Breakpoints matching CSS
export const BREAKPOINTS = {
  IPHONE_SE: 375,        // SE, X, XS, 11 Pro, 12/13 Mini
  IPHONE_REGULAR: 390,   // 12/13/14/15
  IPHONE_PRO: 393,       // 14/15 Pro
  IPHONE_PLUS: 414,      // 11, XR, XS Max, 11 Pro Max
  IPHONE_PRO_MAX: 428,   // 12/13/14 Pro Max, 14 Plus
  IPHONE_MAX_NEW: 430,   // 15 Pro Max, 15 Plus
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
};

// iPhone models detection based on screen size
export const IPHONE_MODELS = {
  // 375px width models
  SE_OLD: { width: 375, height: 667, name: 'iPhone SE (1st/2nd/3rd gen)' },
  X: { width: 375, height: 812, name: 'iPhone X' },
  XS: { width: 375, height: 812, name: 'iPhone XS' },
  ELEVEN_PRO: { width: 375, height: 812, name: 'iPhone 11 Pro' },
  TWELVE_MINI: { width: 375, height: 812, name: 'iPhone 12 Mini' },
  THIRTEEN_MINI: { width: 375, height: 812, name: 'iPhone 13 Mini' },
  
  // 390px width models  
  TWELVE: { width: 390, height: 844, name: 'iPhone 12' },
  TWELVE_PRO: { width: 390, height: 844, name: 'iPhone 12 Pro' },
  THIRTEEN: { width: 390, height: 844, name: 'iPhone 13' },
  THIRTEEN_PRO: { width: 390, height: 844, name: 'iPhone 13 Pro' },
  FOURTEEN: { width: 390, height: 844, name: 'iPhone 14' },
  FIFTEEN: { width: 390, height: 844, name: 'iPhone 15' },
  
  // 393px width models
  FOURTEEN_PRO: { width: 393, height: 852, name: 'iPhone 14 Pro' },
  FIFTEEN_PRO: { width: 393, height: 852, name: 'iPhone 15 Pro' },
  
  // 414px width models
  XR: { width: 414, height: 896, name: 'iPhone XR' },
  ELEVEN: { width: 414, height: 896, name: 'iPhone 11' },
  ELEVEN_PRO_MAX: { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
  XS_MAX: { width: 414, height: 896, name: 'iPhone XS Max' },
  
  // 428px width models
  TWELVE_PRO_MAX: { width: 428, height: 926, name: 'iPhone 12 Pro Max' },
  THIRTEEN_PRO_MAX: { width: 428, height: 926, name: 'iPhone 13 Pro Max' },
  FOURTEEN_PLUS: { width: 428, height: 926, name: 'iPhone 14 Plus' },
  FOURTEEN_PRO_MAX: { width: 428, height: 926, name: 'iPhone 14 Pro Max' },
  
  // 430px width models
  FIFTEEN_PLUS: { width: 430, height: 932, name: 'iPhone 15 Plus' },
  FIFTEEN_PRO_MAX: { width: 430, height: 932, name: 'iPhone 15 Pro Max' },
};

/**
 * Check if current device is mobile
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= BREAKPOINTS.MOBILE
  );
};

/**
 * Check if current device is iPhone
 */
export const isIPhone = () => {
  if (typeof window === 'undefined') return false;
  
  return /iPhone/i.test(navigator.userAgent) || 
         (/iPad/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
};

/**
 * Check if current device is Android
 */
export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
};

/**
 * Check if current device is iPad
 */
export const isIPad = () => {
  if (typeof window === 'undefined') return false;
  
  return /iPad/i.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/**
 * Detect specific iPhone model based on screen dimensions
 */
export const detectIPhoneModel = () => {
  if (!isIPhone()) return null;
  
  const width = window.screen.width;
  const height = window.screen.height;
  
  // Find matching model
  for (const [key, model] of Object.entries(IPHONE_MODELS)) {
    if (
      (width === model.width && height === model.height) ||
      (width === model.height && height === model.width) // Handle rotation
    ) {
      return { ...model, key };
    }
  }
  
  return { name: 'Unknown iPhone', width, height };
};

/**
 * Check if device has notch (iPhone X and newer)
 */
export const hasNotch = () => {
  if (!isIPhone()) return false;
  
  // iPhone X and newer have taller aspect ratio
  const ratio = window.screen.height / window.screen.width;
  return ratio > 2.0; // Notch iPhones have ~2.16 ratio
};

/**
 * Check if device has Dynamic Island (iPhone 14 Pro and newer)
 */
export const hasDynamicIsland = () => {
  if (!isIPhone()) return false;
  
  const model = detectIPhoneModel();
  return model && (
    model.name.includes('14 Pro') || 
    model.name.includes('15 Pro') ||
    model.name.includes('16 Pro')
  );
};

/**
 * Get safe area insets
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0') || 0,
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0') || 0,
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0') || 0,
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0') || 0,
  };
};

/**
 * Get current viewport width
 */
export const getViewportWidth = () => {
  if (typeof window === 'undefined') return 0;
  
  return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};

/**
 * Get current viewport height
 */
export const getViewportHeight = () => {
  if (typeof window === 'undefined') return 0;
  
  return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
};

/**
 * Check if viewport matches a breakpoint
 */
export const matchesBreakpoint = (breakpoint) => {
  const width = getViewportWidth();
  
  switch (breakpoint) {
    case 'mobile':
      return width <= BREAKPOINTS.MOBILE;
    case 'tablet':
      return width > BREAKPOINTS.MOBILE && width <= BREAKPOINTS.TABLET;
    case 'desktop':
      return width > BREAKPOINTS.TABLET;
    case 'iphone-se':
      return width <= BREAKPOINTS.IPHONE_SE;
    case 'iphone-regular':
      return width > BREAKPOINTS.IPHONE_SE && width <= BREAKPOINTS.IPHONE_PRO;
    case 'iphone-plus':
      return width > BREAKPOINTS.IPHONE_PRO && width <= BREAKPOINTS.IPHONE_PLUS;
    case 'iphone-pro-max':
      return width > BREAKPOINTS.IPHONE_PLUS && width <= BREAKPOINTS.IPHONE_PRO_MAX;
    case 'iphone-max-new':
      return width > BREAKPOINTS.IPHONE_PRO_MAX && width <= BREAKPOINTS.IPHONE_MAX_NEW;
    default:
      return false;
  }
};

/**
 * Get responsive class names based on breakpoints
 */
export const getResponsiveClass = (baseClass, breakpoint) => {
  const classes = [baseClass];
  
  if (matchesBreakpoint('mobile')) {
    classes.push(`${baseClass}--mobile`);
  }
  if (matchesBreakpoint('tablet')) {
    classes.push(`${baseClass}--tablet`);
  }
  if (matchesBreakpoint('desktop')) {
    classes.push(`${baseClass}--desktop`);
  }
  
  if (isIPhone()) {
    classes.push(`${baseClass}--iphone`);
    
    if (hasNotch()) {
      classes.push(`${baseClass}--notch`);
    }
    if (hasDynamicIsland()) {
      classes.push(`${baseClass}--dynamic-island`);
    }
  }
  
  return classes.join(' ');
};

/**
 * Check if device is in landscape mode
 */
export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth > window.innerHeight;
};

/**
 * Check if device is in portrait mode
 */
export const isPortrait = () => {
  return !isLandscape();
};

/**
 * Get device pixel ratio
 */
export const getPixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
};

/**
 * Check if device is Retina display
 */
export const isRetina = () => {
  return getPixelRatio() >= 2;
};

/**
 * Debounce resize events
 */
export const debounce = (func, wait = 250) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Hook into window resize events
 */
export const onResize = (callback, debounceDelay = 250) => {
  if (typeof window === 'undefined') return () => {};
  
  const debouncedCallback = debounce(callback, debounceDelay);
  
  window.addEventListener('resize', debouncedCallback);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', debouncedCallback);
  };
};

/**
 * Hook into orientation change events
 */
export const onOrientationChange = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleOrientationChange = () => {
    callback({
      isLandscape: isLandscape(),
      isPortrait: isPortrait(),
      width: getViewportWidth(),
      height: getViewportHeight(),
    });
  };
  
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};

/**
 * Get device information
 */
export const getDeviceInfo = () => {
  return {
    isMobile: isMobile(),
    isIPhone: isIPhone(),
    isAndroid: isAndroid(),
    isIPad: isIPad(),
    hasNotch: hasNotch(),
    hasDynamicIsland: hasDynamicIsland(),
    model: detectIPhoneModel(),
    viewport: {
      width: getViewportWidth(),
      height: getViewportHeight(),
    },
    orientation: {
      isLandscape: isLandscape(),
      isPortrait: isPortrait(),
    },
    pixelRatio: getPixelRatio(),
    isRetina: isRetina(),
    safeAreaInsets: getSafeAreaInsets(),
  };
};

/**
 * Log device information (useful for debugging)
 */
export const logDeviceInfo = () => {
  const info = getDeviceInfo();
  
  console.group('📱 Device Information');
  console.log('Mobile:', info.isMobile);
  console.log('iPhone:', info.isIPhone);
  console.log('Android:', info.isAndroid);
  console.log('iPad:', info.isIPad);
  console.log('Has Notch:', info.hasNotch);
  console.log('Has Dynamic Island:', info.hasDynamicIsland);
  console.log('Model:', info.model);
  console.log('Viewport:', info.viewport);
  console.log('Orientation:', info.orientation);
  console.log('Pixel Ratio:', info.pixelRatio);
  console.log('Retina:', info.isRetina);
  console.log('Safe Area Insets:', info.safeAreaInsets);
  console.groupEnd();
  
  return info;
};

/**
 * Apply responsive font size based on viewport
 */
export const getResponsiveFontSize = (baseSize = 16) => {
  const width = getViewportWidth();
  
  if (width <= BREAKPOINTS.IPHONE_SE) {
    return baseSize * 0.9375; // 15px for base 16px
  } else if (width <= BREAKPOINTS.IPHONE_REGULAR) {
    return baseSize; // 16px
  } else if (width <= BREAKPOINTS.IPHONE_MAX) {
    return baseSize * 1.0625; // 17px for base 16px
  } else if (width <= BREAKPOINTS.MOBILE) {
    return baseSize;
  } else {
    return baseSize * 1.125; // Larger on desktop
  }
};

/**
 * Get optimal touch target size for current device
 */
export const getTouchTargetSize = () => {
  // Apple HIG recommends 44x44 minimum
  // Android Material Design recommends 48x48
  
  if (isIPhone()) {
    return 44;
  } else if (isAndroid()) {
    return 48;
  } else {
    return 44; // Default
  }
};

export default {
  BREAKPOINTS,
  IPHONE_MODELS,
  isMobile,
  isIPhone,
  isAndroid,
  isIPad,
  detectIPhoneModel,
  hasNotch,
  hasDynamicIsland,
  getSafeAreaInsets,
  getViewportWidth,
  getViewportHeight,
  matchesBreakpoint,
  getResponsiveClass,
  isLandscape,
  isPortrait,
  getPixelRatio,
  isRetina,
  debounce,
  onResize,
  onOrientationChange,
  getDeviceInfo,
  logDeviceInfo,
  getResponsiveFontSize,
  getTouchTargetSize,
};

