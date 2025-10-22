import React, { useState, useEffect, useRef } from 'react';

const SwipeGestures = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  onSwipeUp, 
  onSwipeDown,
  threshold = 50,
  velocity = 0.3,
  disabled = false 
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchStart = (e) => {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      });
      setTouchEnd(null);
      setIsSwipeActive(true);
    };

    const handleTouchMove = (e) => {
      if (!touchStart) return;
      
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const deltaTime = touchEnd.time - touchStart.time;
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Check if swipe meets threshold and velocity requirements
      if (Math.abs(deltaX) > threshold && velocityX > velocity) {
        if (deltaX > 0) {
          onSwipeRight && onSwipeRight();
        } else {
          onSwipeLeft && onSwipeLeft();
        }
      } else if (Math.abs(deltaY) > threshold && velocityY > velocity) {
        if (deltaY > 0) {
          onSwipeDown && onSwipeDown();
        } else {
          onSwipeUp && onSwipeUp();
        }
      }

      setIsSwipeActive(false);
      setTouchStart(null);
      setTouchEnd(null);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, touchEnd, threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, disabled]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {children}
    </div>
  );
};

// Hook for swipe gestures
export const useSwipeGestures = (callbacks, options = {}) => {
  const [gestureState, setGestureState] = useState({
    isActive: false,
    direction: null,
    distance: 0,
    velocity: 0
  });

  const handleSwipe = (direction, distance, velocity) => {
    setGestureState({
      isActive: true,
      direction,
      distance,
      velocity
    });

    // Call appropriate callback
    const callback = callbacks[direction];
    if (callback) {
      callback({ direction, distance, velocity });
    }

    // Reset after a short delay
    setTimeout(() => {
      setGestureState({
        isActive: false,
        direction: null,
        distance: 0,
        velocity: 0
      });
    }, 200);
  };

  return {
    gestureState,
    SwipeContainer: ({ children }) => (
      <SwipeGestures
        onSwipeLeft={() => handleSwipe('left', 0, 0)}
        onSwipeRight={() => handleSwipe('right', 0, 0)}
        onSwipeUp={() => handleSwipe('up', 0, 0)}
        onSwipeDown={() => handleSwipe('down', 0, 0)}
        threshold={options.threshold || 50}
        velocity={options.velocity || 0.3}
        disabled={options.disabled || false}
      >
        {children}
      </SwipeGestures>
    )
  };
};

export default SwipeGestures;
