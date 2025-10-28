import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect scroll direction for a specific element (like ContentArea)
 * @param {React.RefObject} elementRef - Ref to the scrollable element
 * @param {number} threshold - Minimum scroll distance to trigger direction change
 * @returns {Object} { isScrollingDown: boolean, lastScrollY: number, isAtTop: boolean }
 */
export const useElementScrollDirection = (elementRef, threshold = 10) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const ticking = useRef(false);

  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    const updateScrollDirection = () => {
      const scrollY = element.scrollTop;
      
      // Check if at top
      setIsAtTop(scrollY < threshold);

      // Only update if scrolled more than threshold
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking.current = false;
        return;
      }

      // Determine scroll direction
      if (scrollY > lastScrollY && scrollY > threshold) {
        // Scrolling down
        setIsScrollingDown(true);
      } else if (scrollY < lastScrollY) {
        // Scrolling up
        setIsScrollingDown(false);
      }

      setLastScrollY(scrollY > 0 ? scrollY : 0);
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    element.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', onScroll);
    };
  }, [lastScrollY, threshold, elementRef]);

  return { isScrollingDown, lastScrollY, isAtTop };
};

export default useElementScrollDirection;
