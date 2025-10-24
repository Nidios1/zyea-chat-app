/**
 * Performance Optimization Utilities
 * Battery saving, memory management, network optimization
 */

// Debounce function for expensive operations
export const debounce = (func, wait = 300) => {
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

// Throttle function for scroll/resize events
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Image lazy loading with Intersection Observer
export const setupLazyLoading = (imageSelector = 'img[data-src]') => {
  const images = document.querySelectorAll(imageSelector);
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    images.forEach(img => imageObserver.observe(img));
    
    return () => images.forEach(img => imageObserver.unobserve(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    images.forEach(img => {
      img.src = img.dataset.src;
    });
  }
};

// Optimize images before upload
export const optimizeImage = async (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Request Idle Callback wrapper
export const scheduleIdleTask = (callback) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout: 2000 });
  } else {
    return setTimeout(callback, 1);
  }
};

// Batch DOM updates
export const batchUpdate = (updates) => {
  return new Promise((resolve) => {
    scheduleIdleTask(() => {
      updates.forEach(update => update());
      resolve();
    });
  });
};

// Memoize expensive computations
export const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

// Network request batching
class RequestBatcher {
  constructor(batchSize = 5, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.timer = null;
  }

  add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.batchSize);
    
    if (batch.length === 0) return;

    try {
      const results = await Promise.all(
        batch.map(item => item.request())
      );
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }
}

export const requestBatcher = new RequestBatcher();

// Reduce battery drain
export const batteryOptimizer = {
  // Reduce animation when battery is low
  shouldReduceMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check battery status
  getBatteryInfo: async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  // Adjust quality based on battery
  shouldReduceQuality: async () => {
    const battery = await batteryOptimizer.getBatteryInfo();
    if (!battery) return false;
    
    // Reduce quality if battery < 20% and not charging
    return battery.level < 0.2 && !battery.charging;
  },

  // Reduce network requests when battery low
  shouldBatchRequests: async () => {
    const battery = await batteryOptimizer.getBatteryInfo();
    if (!battery) return false;
    
    return battery.level < 0.3 && !battery.charging;
  }
};

// Memory management
export const memoryManager = {
  // Clear unused caches
  clearCaches: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        !name.includes('current') && !name.includes('v1')
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log(`🗑️ Cleared ${oldCaches.length} old caches`);
    }
  },

  // Get memory usage (Chrome only)
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
        percentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
      };
    }
    return null;
  },

  // Monitor memory and warn
  monitorMemory: () => {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usage > 90) {
          console.warn('⚠️ High memory usage:', usage.toFixed(2) + '%');
        }
      }, 30000); // Check every 30s
    }
  }
};

// Prefetch resources
export const prefetchResource = (url, type = 'fetch') => {
  const link = document.createElement('link');
  link.rel = type === 'image' ? 'preload' : 'prefetch';
  link.as = type;
  link.href = url;
  document.head.appendChild(link);
};

// Preload critical resources
export const preloadCritical = (resources) => {
  resources.forEach(({ url, type }) => {
    prefetchResource(url, type);
  });
};

// Code splitting helper
export const loadComponent = async (componentPath) => {
  try {
    const component = await import(/* webpackChunkName: "[request]" */ `${componentPath}`);
    return component.default;
  } catch (error) {
    console.error('Failed to load component:', error);
    return null;
  }
};

export default {
  debounce,
  throttle,
  setupLazyLoading,
  optimizeImage,
  scheduleIdleTask,
  batchUpdate,
  memoize,
  requestBatcher,
  batteryOptimizer,
  memoryManager,
  prefetchResource,
  preloadCritical,
  loadComponent
};

