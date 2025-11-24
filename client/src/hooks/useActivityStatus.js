import { useState, useEffect } from 'react';

/**
 * Custom hook to manage activity status visibility setting
 * Reads from localStorage and listens for changes
 */
export const useActivityStatus = () => {
  const [activityStatusEnabled, setActivityStatusEnabled] = useState(true);

  useEffect(() => {
    // Load initial value from localStorage
    const loadActivityStatus = () => {
      try {
        const saved = localStorage.getItem('activityStatusEnabled');
        if (saved !== null) {
          setActivityStatusEnabled(saved === 'true');
        }
      } catch (error) {
        console.error('Error loading activity status:', error);
      }
    };

    loadActivityStatus();

    // Listen for changes (poll every second as fallback)
    const interval = setInterval(loadActivityStatus, 1000);

    // Listen for storage events (when changed in another tab/window or same window)
    const handleStorageChange = (e) => {
      if (e.key === 'activityStatusEnabled') {
        setActivityStatusEnabled(e.newValue === 'true');
      }
    };

    // Listen to both storage event (cross-tab) and custom storage event (same tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events dispatched from same window
    const handleCustomStorage = (e) => {
      if (e.detail?.key === 'activityStatusEnabled') {
        setActivityStatusEnabled(e.detail.newValue === 'true');
      }
    };
    
    // Custom event listener for same-window updates
    window.addEventListener('activityStatusChanged', handleCustomStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('activityStatusChanged', handleCustomStorage);
    };
  }, []);

  return activityStatusEnabled;
};

export default useActivityStatus;

