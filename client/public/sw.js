// Enhanced service worker for PWA with advanced caching strategies
// Version sẽ tự động tăng khi có update
const CACHE_VERSION = Date.now(); // Dùng timestamp để đảm bảo cache mới mỗi lần build
const CACHE_NAME = `zyea-v${CACHE_VERSION}`;
const STATIC_CACHE = `zyea-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `zyea-dynamic-v${CACHE_VERSION}`;
const API_CACHE = `zyea-api-v${CACHE_VERSION}`;

console.log('🚀 Service Worker version:', CACHE_VERSION);

// Cache core files only - no specific hashed files
const CORE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const API_URLS = [
  '/api/users/profile',
  '/api/friends',
  '/api/chat/messages'
];

// Install event with better error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching core assets');
        // Cache core files one by one with error handling
        return Promise.allSettled(
          CORE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              return Promise.resolve();
            })
          )
        );
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Dynamic cache ready');
        return cache;
      })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    }).catch(err => {
      console.log('Service Worker install failed:', err);
      return self.skipWaiting();
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Core files - Cache First
    if (CORE_URLS.some(coreUrl => request.url.includes(coreUrl))) {
      event.respondWith(cacheFirst(request));
    }
    // API requests - Network First with fallback
    else if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request));
    }
    // Images and media - Cache First
    else if (request.destination === 'image' || request.destination === 'media') {
      event.respondWith(cacheFirst(request));
    }
    // Navigation requests - Network First
    else if (request.mode === 'navigate') {
      event.respondWith(networkFirst(request));
    }
    // Other requests - Stale While Revalidate
    else {
      event.respondWith(staleWhileRevalidate(request));
    }
  }
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network first failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'send-message') {
    event.waitUntil(sendPendingMessages());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Bạn có tin nhắn mới',
    icon: '/Zyea.jpg',
    badge: '/Zyea.jpg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Mở ứng dụng',
        icon: '/Zyea.jpg'
      },
      {
        action: 'close',
        title: 'Đóng',
        icon: '/Zyea.jpg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Zyea+', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('SW received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Helper function for sending pending messages
async function sendPendingMessages() {
  try {
    // Get pending messages from IndexedDB or localStorage
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${message.token}`
          },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.log('Failed to send message:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingMessages() {
  // Implementation would depend on your data storage strategy
  return [];
}

async function removePendingMessage(id) {
  // Implementation would depend on your data storage strategy
}
