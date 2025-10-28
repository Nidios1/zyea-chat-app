import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/mobile-responsive-master.css'; // ⭐ FILE DUY NHẤT cho mobile responsive
import App from './App';
import { initMobileLayout } from './utils/initMobileLayout';

// Initialize mobile layout
initMobileLayout();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Register Service Worker for PWA with error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // First, unregister any existing broken service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered old service worker');
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('Cleared all caches');
      }

      // Wait a bit before re-registering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now register the new service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update().catch(err => console.log('SW update check failed:', err));
      }, 60000); // Check every minute
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, show update notification
            if (window.confirm('Có phiên bản mới! Tải lại trang để cập nhật?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
      // Silently fail - don't show error to user
    }

    // Listen for service worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

// Request notification permission for PWA
if ('Notification' in window && 'serviceWorker' in navigator) {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
  });
}