import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/mobile-responsive-master.css'; // ⭐ FILE DUY NHẤT cho mobile responsive
import App from './App';
import { initMobileLayout } from './utils/initMobileLayout';
import MobileOnboardBanner from './components/Common/MobileOnboardBanner';

// Initialize mobile layout
initMobileLayout();

const root = ReactDOM.createRoot(document.getElementById('root'));

// Kiểm tra nếu là mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 window.innerWidth < 768;

// CHỈ hiển thị banner khi: mobile + truy cập từ web browser (không phải PWA standalone)
// Kiểm tra xem có đang chạy trong PWA standalone mode không
const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;

// TRÊN MOBILE + web browser: Hiển thị banner, KHÔNG hiển thị React PWA app
// TRÊN PC hoặc PWA standalone: Hiển thị React PWA app bình thường
const shouldShowOnboard = isMobile && !isPWAStandalone;

// Ngăn chặn hiển thị React PWA trên mobile
// TRÊN MOBILE: Chỉ hiển thị banner, KHÔNG hiển thị React PWA app
// TRÊN PC: Hiển thị React PWA app bình thường
if (shouldShowOnboard) {
  // Thêm class để ẩn mọi thứ khác
  document.body.classList.add('onboard-banner-active');
  document.documentElement.classList.add('onboard-banner-active');
  
  // Ẩn body scroll và các element khác
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.height = '100%';
  document.body.style.top = '0';
  document.body.style.left = '0';
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  document.documentElement.style.position = 'fixed';
  document.documentElement.style.width = '100%';
  document.documentElement.style.height = '100%';
  
  // Ẩn root element background và đảm bảo chỉ banner hiển thị
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.style.position = 'fixed';
    rootElement.style.top = '0';
    rootElement.style.left = '0';
    rootElement.style.right = '0';
    rootElement.style.bottom = '0';
    rootElement.style.width = '100%';
    rootElement.style.height = '100%';
    rootElement.style.margin = '0';
    rootElement.style.padding = '0';
    rootElement.style.overflow = 'hidden';
    rootElement.style.zIndex = '1';
    rootElement.style.background = '#ffffff';
  }
  
  // Override body/html background để đảm bảo trắng
  document.body.style.background = '#ffffff';
  document.documentElement.style.background = '#ffffff';
  
  // Không cần ngăn chặn navigation vì App component không được render
  // Banner sẽ hiển thị và người dùng chỉ có thể tương tác với banner
  
  // Ẩn tất cả các element khác (toast, notifications, app components, etc.)
  const style = document.createElement('style');
  style.id = 'onboard-banner-hide-others';
  style.textContent = `
    /* CRITICAL: Override tất cả CSS global cho Safari mobile */
    body.onboard-banner-active,
    html.onboard-banner-active {
      background: #ffffff !important;
      position: relative !important;
      overflow: visible !important;
      height: auto !important;
    }
    
    body.onboard-banner-active #root {
      background: #ffffff !important;
      position: relative !important;
      overflow: visible !important;
      height: auto !important;
    }
    
    /* Ẩn HOÀN TOÀN tất cả element trừ banner và children của banner */
    body.onboard-banner-active #root > *:not([data-onboard-banner]),
    body.onboard-banner-active #root > *:not([data-onboard-banner]) *,
    body.onboard-banner-active .App,
    body.onboard-banner-active [class*="App"],
    body.onboard-banner-active [class*="Login"],
    body.onboard-banner-active [class*="Register"],
    body.onboard-banner-active [class*="Router"],
    body.onboard-banner-active [class*="Routes"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      left: -9999px !important;
      width: 0 !important;
      height: 0 !important;
    }
    
    /* CRITICAL: Hiển thị banner - override mọi CSS */
    body.onboard-banner-active [data-onboard-banner] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      position: fixed !important;
      z-index: 999999 !important;
      width: 100vw !important;
      width: 100% !important;
      height: 100vh !important;
      height: 100% !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* Safari iOS specific */
    @supports (-webkit-touch-callout: none) {
      body.onboard-banner-active [data-onboard-banner] {
        height: -webkit-fill-available !important;
        min-height: 100vh !important;
      }
    }
    
    /* Children của banner - đảm bảo visible và không bị ẩn */
    body.onboard-banner-active [data-onboard-banner] > * {
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    
    /* Tất cả descendants của banner */
    body.onboard-banner-active [data-onboard-banner] * {
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }
    
    /* Đảm bảo Header hiển thị với flex */
    body.onboard-banner-active [data-onboard-banner] > div:first-child {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Đảm bảo Content hiển thị với flex */
    body.onboard-banner-active [data-onboard-banner] > div:nth-child(2) {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    /* Đảm bảo tất cả styled components hiển thị */
    body.onboard-banner-active [data-onboard-banner] div,
    body.onboard-banner-active [data-onboard-banner] button,
    body.onboard-banner-active [data-onboard-banner] img,
    body.onboard-banner-active [data-onboard-banner] span {
      visibility: visible !important;
      opacity: 1 !important;
      display: revert !important;
    }
    
    /* Ẩn toast notifications */
    body.onboard-banner-active .Toastify,
    body.onboard-banner-active [class*="Toastify"],
    body.onboard-banner-active [id*="toast"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
    
    /* Ẩn offline indicator và các fixed elements khác */
    body.onboard-banner-active [style*="position: fixed"]:not([data-onboard-banner]),
    body.onboard-banner-active [style*="position:fixed"]:not([data-onboard-banner]) {
      display: none !important;
      visibility: hidden !important;
    }
  `;
  document.head.appendChild(style);
}

// Render: Nếu mobile + từ link → chỉ hiển thị onboard banner, KHÔNG render App
// Nếu không → chỉ render App
try {
  root.render(
    <React.StrictMode>
      {shouldShowOnboard ? (
        <MobileOnboardBanner mandatory={true} />
      ) : (
        <App />
      )}
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  // Fallback: render App nếu có lỗi
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Unregister Service Worker trên mobile nếu đã có (xóa PWA trên mobile)
if ('serviceWorker' in navigator && isMobile) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Unregistered service worker on mobile:', registration.scope);
      }
      
      // Clear all caches trên mobile
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('✅ Cleared all caches on mobile');
      }
    } catch (error) {
      console.log('Error unregistering service worker on mobile:', error);
    }
  });
}

// Register Service Worker for PWA - CHỈ TRÊN PC, KHÔNG ĐĂNG KÝ TRÊN MOBILE
if ('serviceWorker' in navigator && !isMobile) {
  window.addEventListener('load', async () => {
    try {
      // Kiểm tra nếu đã có service worker đang chạy
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      const hasActiveSW = navigator.serviceWorker.controller !== null;
      
      // Chỉ unregister nếu không có active service worker hoặc trong development
      // Tránh unregister/re-register mỗi lần load gây reload loop
      if (!hasActiveSW || process.env.NODE_ENV === 'development') {
        for (const registration of existingRegistrations) {
        await registration.unregister();
        console.log('Unregistered old service worker');
      }

        // Clear all caches chỉ khi unregister
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('Cleared all caches');
      }

      // Wait a bit before re-registering
      await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Now register the new service worker (hoặc sử dụng existing)
      let registration;
      if (existingRegistrations.length > 0 && hasActiveSW) {
        registration = existingRegistrations[0];
        console.log('Using existing service worker');
      } else {
        registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
      }
      
      // Check for updates periodically - Đã tắt
      // setInterval(() => {
      //   registration.update().catch(err => console.log('SW update check failed:', err));
      // }, 60000); // Check every minute
      
      // Listen for updates - Đã tắt thông báo update
      // registration.addEventListener('updatefound', () => {
      //   const newWorker = registration.installing;
      //   newWorker.addEventListener('statechange', () => {
      //     if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      //       // New service worker available - không hiển thị thông báo
      //     }
      //   });
      // });
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
      // Silently fail - don't show error to user
    }

    // Listen for service worker controller change - Đã tắt reload tự động
    // Không reload tự động để tránh reload loop trên mobile
    // navigator.serviceWorker.addEventListener('controllerchange', () => {
    //   window.location.reload();
    // });
  });
}

// Request notification permission for PWA - CHỈ TRÊN PC, KHÔNG TRÊN MOBILE
if ('Notification' in window && 'serviceWorker' in navigator && !isMobile) {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
  });
}