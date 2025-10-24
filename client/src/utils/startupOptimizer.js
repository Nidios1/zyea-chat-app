/**
 * Startup Time Optimizer
 * Reduce app startup time from ~1.5s to < 800ms
 */

import { scheduleIdleTask, preloadCritical } from './performanceOptimizer';
import { initDatabase } from './sqlite';

// Critical resources to preload
const criticalResources = [
  { url: '/Zyea.jpg', type: 'image' },
  { url: '/app.jpg', type: 'image' },
  { url: '/manifest.json', type: 'fetch' }
];

// Non-critical resources to lazy load
const nonCriticalResources = [
  '/static/css/main.css',
  '/static/js/main.js'
];

/**
 * Initialize app with optimized startup
 */
export const initializeApp = async (onProgress) => {
  const startTime = performance.now();
  
  console.log('🚀 Starting optimized initialization...');

  // Step 1: Preload critical resources (0-20%)
  onProgress?.(10);
  preloadCritical(criticalResources);
  onProgress?.(20);

  // Step 2: Initialize database in parallel (20-40%)
  const dbPromise = initDatabase().catch(err => {
    console.warn('DB init failed, continuing:', err);
    return null;
  });
  onProgress?.(30);

  // Step 3: Load user session (40-60%)
  const token = localStorage.getItem('token');
  let user = null;
  
  if (token) {
    try {
      const { getApiBaseUrl } = await import('./platformConfig');
      const apiUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiUrl}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        user = await response.json();
        onProgress?.(60);
      }
    } catch (error) {
      console.warn('User load failed:', error);
    }
  }

  // Step 4: Wait for database (60-70%)
  await dbPromise;
  onProgress?.(70);

  // Step 5: Lazy load non-critical resources in background (70-80%)
  scheduleIdleTask(() => {
    nonCriticalResources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  });
  onProgress?.(80);

  // Step 6: Setup performance monitoring (80-90%)
  if ('PerformanceObserver' in window) {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) {
            console.warn('⚠️ Slow operation:', entry.name, entry.duration + 'ms');
          }
        }
      });
      perfObserver.observe({ entryTypes: ['measure', 'navigation'] });
    } catch (error) {
      console.warn('Performance observer failed:', error);
    }
  }
  onProgress?.(90);

  // Step 7: Complete (90-100%)
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`✅ App initialized in ${duration.toFixed(0)}ms`);
  onProgress?.(100);

  // Report performance metrics
  if ('performance' in window && 'getEntriesByType' in performance) {
    scheduleIdleTask(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        console.log('📊 Performance Metrics:', {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          domProcessing: perfData.domComplete - perfData.domLoading,
          total: perfData.loadEventEnd - perfData.fetchStart
        });
      }
    });
  }

  return {
    user,
    duration,
    success: true
  };
};

/**
 * Code splitting - lazy load routes
 */
export const lazyLoadRoute = (componentPath) => {
  return React.lazy(() => 
    import(/* webpackChunkName: "[request]" */ `../${componentPath}`)
      .catch(error => {
        console.error('Failed to load route:', error);
        // Fallback to error page
        return import('../components/Common/ErrorBoundary');
      })
  );
};

/**
 * Optimize bundle size
 */
export const optimizeBundleSize = () => {
  // Tree shaking hints
  if (process.env.NODE_ENV === 'production') {
    // Remove console.log in production
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
  }

  // Dynamic imports for heavy libraries
  const dynamicImports = {
    'emoji-picker-react': () => import('emoji-picker-react'),
    'html5-qrcode': () => import('html5-qrcode'),
    'framer-motion': () => import('framer-motion')
  };

  return dynamicImports;
};

/**
 * Reduce first paint time
 */
export const optimizeFirstPaint = () => {
  // Inline critical CSS
  const criticalCSS = `
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    #root {
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    
    .app-ready {
      opacity: 1 !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);

  // Prevent flash of unstyled content
  document.documentElement.style.opacity = '0';
  window.addEventListener('DOMContentLoaded', () => {
    document.documentElement.style.opacity = '1';
    document.documentElement.style.transition = 'opacity 0.2s';
  });
};

/**
 * Prefetch next routes
 */
export const prefetchRoutes = (routes) => {
  scheduleIdleTask(() => {
    routes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = route;
      document.head.appendChild(link);
    });
  });
};

/**
 * Monitor startup performance
 */
export const monitorStartup = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        if (perfData) {
          const metrics = {
            'DNS Lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
            'TCP Connection': perfData.connectEnd - perfData.connectStart,
            'Request Time': perfData.responseStart - perfData.requestStart,
            'Response Time': perfData.responseEnd - perfData.responseStart,
            'DOM Processing': perfData.domComplete - perfData.domLoading,
            'Total Load Time': perfData.loadEventEnd - perfData.fetchStart
          };

          console.table(metrics);

          // Send to analytics (optional)
          if (metrics['Total Load Time'] > 3000) {
            console.warn('⚠️ Slow startup detected:', metrics['Total Load Time'] + 'ms');
          }
        }
      }, 0);
    });
  }
};

export default {
  initializeApp,
  lazyLoadRoute,
  optimizeBundleSize,
  optimizeFirstPaint,
  prefetchRoutes,
  monitorStartup
};

