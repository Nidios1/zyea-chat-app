/**
 * React Hook for responsive design and device detection
 */

import { useState, useEffect, useMemo } from 'react';
import {
  isMobile,
  isIPhone,
  isAndroid,
  isIPad,
  detectIPhoneModel,
  hasNotch,
  hasDynamicIsland,
  getViewportWidth,
  getViewportHeight,
  getSafeAreaInsets,
  isLandscape,
  isPortrait,
  getPixelRatio,
  isRetina,
  matchesBreakpoint,
  getDeviceInfo,
  onResize,
  onOrientationChange,
  BREAKPOINTS,
} from '../utils/responsive';

/**
 * Main responsive hook
 * 
 * @returns {Object} Responsive state and utilities
 * 
 * @example
 * const { isMobile, isIPhone, viewport, orientation } = useResponsive();
 * 
 * if (isMobile) {
 *   return <MobileComponent />;
 * }
 */
export const useResponsive = () => {
  const [viewport, setViewport] = useState({
    width: getViewportWidth(),
    height: getViewportHeight(),
  });

  const [orientation, setOrientation] = useState({
    isLandscape: isLandscape(),
    isPortrait: isPortrait(),
  });

  const [safeArea, setSafeArea] = useState(getSafeAreaInsets());

  // Update viewport dimensions on resize
  useEffect(() => {
    const cleanup = onResize(() => {
      setViewport({
        width: getViewportWidth(),
        height: getViewportHeight(),
      });
      setSafeArea(getSafeAreaInsets());
    }, 250);

    return cleanup;
  }, []);

  // Update orientation on change
  useEffect(() => {
    const cleanup = onOrientationChange((newOrientation) => {
      setOrientation(newOrientation);
      setViewport({
        width: newOrientation.width,
        height: newOrientation.height,
      });
    });

    return cleanup;
  }, []);

  // Memoize device detection (doesn't change during session)
  const device = useMemo(() => ({
    isMobile: isMobile(),
    isIPhone: isIPhone(),
    isAndroid: isAndroid(),
    isIPad: isIPad(),
    hasNotch: hasNotch(),
    hasDynamicIsland: hasDynamicIsland(),
    model: detectIPhoneModel(),
    pixelRatio: getPixelRatio(),
    isRetina: isRetina(),
  }), []);

  // Memoize breakpoint matches based on viewport
  const breakpoints = useMemo(() => ({
    isMobile: viewport.width <= BREAKPOINTS.MOBILE,
    isTablet: viewport.width > BREAKPOINTS.MOBILE && viewport.width <= BREAKPOINTS.TABLET,
    isDesktop: viewport.width > BREAKPOINTS.TABLET,
    isIPhoneSE: viewport.width <= BREAKPOINTS.IPHONE_SE,
    isIPhoneRegular: viewport.width > BREAKPOINTS.IPHONE_SE && viewport.width <= BREAKPOINTS.IPHONE_REGULAR,
    isIPhonePlus: viewport.width > BREAKPOINTS.IPHONE_REGULAR && viewport.width <= BREAKPOINTS.IPHONE_MAX,
  }), [viewport.width]);

  return {
    // Device detection
    ...device,
    
    // Viewport
    viewport,
    
    // Orientation
    ...orientation,
    
    // Safe area
    safeArea,
    
    // Breakpoints
    breakpoints,
    
    // Utilities
    matchesBreakpoint,
  };
};

/**
 * Hook for viewport dimensions only
 * 
 * @returns {Object} Viewport width and height
 * 
 * @example
 * const { width, height } = useViewport();
 */
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: getViewportWidth(),
    height: getViewportHeight(),
  });

  useEffect(() => {
    const cleanup = onResize(() => {
      setViewport({
        width: getViewportWidth(),
        height: getViewportHeight(),
      });
    }, 250);

    return cleanup;
  }, []);

  return viewport;
};

/**
 * Hook for orientation detection
 * 
 * @returns {Object} Orientation state
 * 
 * @example
 * const { isLandscape, isPortrait } = useOrientation();
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    isLandscape: isLandscape(),
    isPortrait: isPortrait(),
  });

  useEffect(() => {
    const cleanup = onOrientationChange((newOrientation) => {
      setOrientation(newOrientation);
    });

    return cleanup;
  }, []);

  return orientation;
};

/**
 * Hook for safe area insets
 * 
 * @returns {Object} Safe area insets
 * 
 * @example
 * const { top, bottom, left, right } = useSafeArea();
 */
export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState(getSafeAreaInsets());

  useEffect(() => {
    const cleanup = onResize(() => {
      setSafeArea(getSafeAreaInsets());
    }, 250);

    return cleanup;
  }, []);

  return safeArea;
};

/**
 * Hook for device detection (static, doesn't update)
 * 
 * @returns {Object} Device information
 * 
 * @example
 * const { isMobile, isIPhone, hasNotch } = useDevice();
 */
export const useDevice = () => {
  return useMemo(() => ({
    isMobile: isMobile(),
    isIPhone: isIPhone(),
    isAndroid: isAndroid(),
    isIPad: isIPad(),
    hasNotch: hasNotch(),
    hasDynamicIsland: hasDynamicIsland(),
    model: detectIPhoneModel(),
    pixelRatio: getPixelRatio(),
    isRetina: isRetina(),
  }), []);
};

/**
 * Hook for breakpoint matching
 * 
 * @param {string} breakpoint - Breakpoint name ('mobile', 'tablet', 'desktop', etc.)
 * @returns {boolean} True if current viewport matches breakpoint
 * 
 * @example
 * const isMobile = useBreakpoint('mobile');
 */
export const useBreakpoint = (breakpoint) => {
  const [matches, setMatches] = useState(matchesBreakpoint(breakpoint));

  useEffect(() => {
    const handleResize = () => {
      setMatches(matchesBreakpoint(breakpoint));
    };

    const cleanup = onResize(handleResize, 250);
    
    return cleanup;
  }, [breakpoint]);

  return matches;
};

/**
 * Hook for media query matching
 * 
 * @param {string} query - Media query string
 * @returns {boolean} True if media query matches
 * 
 * @example
 * const prefersLightMode = useMediaQuery('(prefers-color-scheme: light)');
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
};

/**
 * Hook for window scroll position
 * 
 * @returns {Object} Scroll position
 * 
 * @example
 * const { x, y } = useScrollPosition();
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState({
    x: typeof window !== 'undefined' ? window.scrollX : 0,
    y: typeof window !== 'undefined' ? window.scrollY : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setScrollPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollPosition;
};

/**
 * Hook to detect if element is in viewport
 * 
 * @param {React.RefObject} ref - Element ref
 * @param {Object} options - Intersection observer options
 * @returns {boolean} True if element is visible
 * 
 * @example
 * const ref = useRef();
 * const isVisible = useInViewport(ref);
 */
export const useInViewport = (ref, options = {}) => {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isIntersecting;
};

/**
 * Hook to log device info on mount (debugging)
 * 
 * @example
 * useDeviceInfo(); // Logs device info to console
 */
export const useDeviceInfo = () => {
  useEffect(() => {
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
  }, []);
};

export default useResponsive;

