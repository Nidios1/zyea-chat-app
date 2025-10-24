/**
 * Native-style Animations
 * Smooth transitions and animations that feel native
 */

// Spring animation config (iOS-like)
export const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 1
};

// Timing animation config (Android Material)
export const timingConfig = {
  type: 'tween',
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1] // Material easing
};

// Slide in from right (iOS push)
export const slideInRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: springConfig
};

// Slide in from left (iOS pop)
export const slideInLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: springConfig
};

// Slide up (iOS modal)
export const slideUp = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: springConfig
};

// Fade in/out
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

// Scale in (Android dialog)
export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: timingConfig
};

// Bounce in (notification)
export const bounceIn = {
  initial: { y: -100, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25
    }
  },
  exit: { y: -100, opacity: 0 }
};

// List item stagger animation
export const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  })
};

// Container for staggered children
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Smooth height animation
export const smoothHeight = {
  initial: { height: 0, opacity: 0 },
  animate: { 
    height: 'auto', 
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: {
      height: { duration: 0.3, delay: 0.1 },
      opacity: { duration: 0.2 }
    }
  }
};

// Page transition variants
export const pageTransition = {
  ios: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-30%' },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30
    }
  },
  android: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: {
      type: 'tween',
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

// Swipe gesture config
export const swipeConfig = {
  threshold: 100,
  velocity: 500,
  resistance: 0.5
};

// Get platform-specific animation
export const getPlatformAnimation = (animationType) => {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  const animations = {
    pageTransition: isIOS ? pageTransition.ios : pageTransition.android,
    modal: isIOS ? slideUp : scaleIn,
    push: isIOS ? slideInRight : scaleIn
  };

  return animations[animationType] || fade;
};

// Create smooth scroll animation
export const smoothScroll = (element, to, duration = 300) => {
  const start = element.scrollTop;
  const change = to - start;
  const startTime = performance.now();

  const animateScroll = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    element.scrollTop = start + (change * easeOut);

    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    }
  };

  requestAnimationFrame(animateScroll);
};

// Request Animation Frame polyfill
export const requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

export default {
  springConfig,
  timingConfig,
  slideInRight,
  slideInLeft,
  slideUp,
  fade,
  scaleIn,
  bounceIn,
  listItemVariants,
  staggerContainer,
  smoothHeight,
  pageTransition,
  swipeConfig,
  getPlatformAnimation,
  smoothScroll,
  requestAnimFrame
};

