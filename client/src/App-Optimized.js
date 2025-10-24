import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';

import AuthContext from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import SplashScreen from './components/Loading/SplashScreen';
import { getToken, removeToken } from './utils/auth';
import { initCopyProtection, preventDevTools } from './utils/copyProtection';
import { isCapacitor, logPlatformInfo } from './utils/platformDetection';
import { getApiBaseUrl } from './utils/platformConfig';
import { initializeApp, monitorStartup, prefetchRoutes } from './utils/startupOptimizer';
import { initDeepLinking, handleDeepLink } from './utils/appShortcuts';
import { initDatabase } from './utils/sqlite';
import { memoryManager } from './utils/performanceOptimizer';
import { fade } from './utils/nativeAnimations';

// Lazy load routes for code splitting
const Login = lazy(() => import('./components/Auth/Login'));
const MobileLogin = lazy(() => import('./components/Mobile/MobileLogin'));
const MobileRegister = lazy(() => import('./components/Mobile/MobileRegister'));
const MobileForgotPassword = lazy(() => import('./components/Mobile/MobileForgotPassword'));
const Register = lazy(() => import('./components/Auth/Register'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const Chat = lazy(() => import('./components/Chat/Chat'));
const InstallPrompt = lazy(() => import('./components/Common/InstallPrompt'));

// Loading fallback
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #0084ff 0%, #00a651 100%)',
    color: 'white'
  }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      Đang tải...
    </motion.div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [preloadedData, setPreloadedData] = useState(null);
  
  // Detect mobile once at initialization
  const [isMobile] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  });

  useEffect(() => {
    // Initialize app with optimizations
    const initApp = async () => {
      const startTime = performance.now();

      // Log platform info
      logPlatformInfo();

      // Add platform classes
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.classList.add('app-ready');
        if (isCapacitor()) {
          rootElement.classList.add('capacitor-app');
          rootElement.classList.add(`${Capacitor.getPlatform()}-app`);
        } else {
          rootElement.classList.add('web-app');
        }
      }

      // Copy protection
      const cleanupCopyProtection = initCopyProtection();
      preventDevTools();

      // Register service worker (PWA only)
      if ('serviceWorker' in navigator && !isCapacitor()) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('✅ Service Worker registered');
        } catch (error) {
          console.warn('SW registration failed:', error);
        }
      }

      // Initialize database (native only)
      if (isCapacitor()) {
        try {
          await initDatabase();
          console.log('✅ SQLite database ready');
        } catch (error) {
          console.warn('SQLite init failed:', error);
        }
      }

      // Initialize with optimized startup
      const result = await initializeApp((progress) => {
        setLoadingProgress(progress);
      });

      if (result.user) {
        setUser(result.user);
      }

      // Monitor startup performance
      monitorStartup();

      // Start memory monitoring
      memoryManager.monitorMemory();

      // Minimum splash time for smooth UX
      const elapsed = performance.now() - startTime;
      const minTime = 1000;
      const delay = Math.max(0, minTime - elapsed);

      setTimeout(() => {
        setLoading(false);
      }, delay);

      // Prefetch routes in background
      prefetchRoutes([
        '/static/js/Chat.chunk.js',
        '/static/js/NewsFeed.chunk.js'
      ]);

      return cleanupCopyProtection;
    };

    const cleanup = initApp();

    return () => {
      if (cleanup) cleanup.then(fn => fn?.());
    };
  }, []);

  // Deep linking setup
  useEffect(() => {
    if (!isCapacitor()) return;

    const listener = initDeepLinking(({ path, params }) => {
      console.log('🔗 Deep link received:', path, params);
      // Handle deep link after login
      if (user) {
        // Will need navigate from router context
        // Store for now and handle in routes
        sessionStorage.setItem('pendingDeepLink', JSON.stringify({ path, params }));
      }
    });

    return () => {
      if (listener) listener.remove();
    };
  }, [user]);

  const login = (userData, token) => {
    console.log('🔐 Login called');
    localStorage.setItem('token', token);
    setUser({ ...userData });
    setLoading(false);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    
    // Clear caches
    if (isCapacitor()) {
      memoryManager.clearCaches();
    }
  };

  const clearUserState = () => {
    removeToken();
    setUser(null);
  };

  if (loading) {
    return <SplashScreen isVisible={true} loadingProgress={loadingProgress} />;
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, login, logout, clearUserState, preloadedData }}>
        <Router>
          <AnimatePresence mode="wait">
            <motion.div 
              className="App"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={fade}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route 
                    path="/m/login" 
                    element={!user ? <MobileLogin /> : <Navigate to="/" />} 
                  />
                  <Route 
                    path="/m/register" 
                    element={!user ? <MobileRegister /> : <Navigate to="/" />} 
                  />
                  <Route 
                    path="/m/forgot-password" 
                    element={!user ? <MobileForgotPassword /> : <Navigate to="/" />} 
                  />
                  <Route 
                    path="/login" 
                    element={!user ? (isMobile ? <Navigate to="/m/login" /> : <Login />) : <Navigate to="/" />} 
                  />
                  <Route 
                    path="/register" 
                    element={!user ? <Register /> : <Navigate to="/" />} 
                  />
                  <Route 
                    path="/forgot-password" 
                    element={!user ? <ForgotPassword /> : <Navigate to="/" />} 
                  />
                  <Route 
                    path="/" 
                    element={user ? <Chat /> : (isMobile ? <MobileLogin /> : <Navigate to="/login" />)} 
                  />
                </Routes>
              </Suspense>
              
              {/* PWA Install Prompt */}
              {!isCapacitor() && (
                <Suspense fallback={null}>
                  <InstallPrompt />
                </Suspense>
              )}
              
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </motion.div>
          </AnimatePresence>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;

