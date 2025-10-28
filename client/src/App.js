import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AuthContext from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ResponsiveWrapper from './components/Common/ResponsiveWrapper';
import Login from './components/Auth/Login';
import MobileLogin from './components/Mobile/MobileLogin';
import MobileRegister from './components/Mobile/MobileRegister';
import MobileForgotPassword from './components/Mobile/MobileForgotPassword';
import MobileTerms from './components/Mobile/MobileTerms';
import MobileSocialTerms from './components/Mobile/MobileSocialTerms';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import DesktopChat from './components/Desktop/DesktopChat';
import MobileChat from './components/Mobile/MobileChat';
import SplashScreen from './components/Loading/SplashScreen';
import AppDownloadPrompt from './components/Loading/AppDownloadPrompt';
import InstallPrompt from './components/Common/InstallPrompt';
import UpdatePrompt from './components/Common/UpdatePrompt';
import SuccessToast from './components/Common/SuccessToast';
import BundleProtectionError from './components/Common/BundleProtectionError';
// import PerformanceMonitor from './components/Common/PerformanceMonitor';
import { getToken, removeToken, getTokenAsync } from './utils/auth';
import { initCopyProtection, preventDevTools } from './utils/copyProtection';
import { initBundleProtection, startContinuousValidation } from './utils/bundleProtection';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useNativeFeatures } from './hooks/useNativeFeatures';
import { isCapacitor, logPlatformInfo } from './utils/platformDetection';
import { getApiBaseUrl } from './utils/platformConfig';
import { checkForUpdates, downloadUpdate, applyUpdate, startAutoUpdateCheck } from './utils/liveUpdate';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [preloadedData, setPreloadedData] = useState(null);
  const [dataLoadingProgress, setDataLoadingProgress] = useState(0);
  const [appStartTime] = useState(Date.now()); // Track khi app bắt đầu
  
  // Bundle Protection state
  const [bundleProtectionFailed, setBundleProtectionFailed] = useState(false);
  
  // Live Update states
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // Detect mobile once at initialization
  const [isMobile] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  });
  
  // PWA features
  const { isOnline, pendingCount, syncPendingData } = useOfflineSync();
  const { requestNotificationPermission, showNotification } = useNativeFeatures();

  // Bundle Protection - ENABLED with proper error handling
  useEffect(() => {
    const validateBundle = async () => {
      try {
        console.log('[Security] Initializing Bundle Protection...');
        
        // Only enable bundle protection in production builds (disabled for web)
        if (false && process.env.NODE_ENV === 'production') {
          const isValid = await initBundleProtection();
          
          if (!isValid) {
            console.error('[Security] ⚠️ Bundle ID validation failed!');
            setBundleProtectionFailed(true);
            return;
          }
          
          // Start continuous validation nếu validate thành công
          startContinuousValidation();
          console.log('[Security] ✅ Bundle Protection active');
        } else {
          console.log('[Security] Bundle Protection skipped (development mode)');
        }
      } catch (error) {
        console.error('[Security] Bundle validation error:', error);
        // Don't fail the app in development, only in production
        if (process.env.NODE_ENV === 'production') {
          setBundleProtectionFailed(true);
        }
      }
    };
    
    validateBundle();
  }, []);

  // Check for updates khi app load
  useEffect(() => {
    const checkUpdate = async () => {
      const update = await checkForUpdates();
      if (update && update.hasUpdate) {
        setUpdateInfo(update);
      }
    };
    
    // Check ngay khi app start
    checkUpdate();
    
    // Auto check mỗi 30s
    const cleanup = startAutoUpdateCheck((update) => {
      setUpdateInfo(update);
    });
    
    return cleanup;
  }, []);

  // Handle update
  const handleUpdate = async () => {
    if (!updateInfo) return;
    
    try {
      setIsDownloadingUpdate(true);
      setUpdateProgress(0);
      
      // Simulate progress (trong thực tế sẽ track download progress)
      const progressInterval = setInterval(() => {
        setUpdateProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);
      
      await downloadUpdate(updateInfo.updateUrl);
      
      clearInterval(progressInterval);
      setUpdateProgress(100);
      
      // Hiển thị thông báo thành công
      setShowSuccessToast(true);
      setIsDownloadingUpdate(false);
      
      // Apply update sau 2.5s (để user thấy toast)
      setTimeout(() => {
        applyUpdate(updateInfo.version); // Pass version mới
      }, 2500);
    } catch (error) {
      console.error('Update failed:', error);
      setIsDownloadingUpdate(false);
      setUpdateProgress(0);
      alert('Cập nhật thất bại. Vui lòng thử lại sau.');
    }
  };

  const handleSkipUpdate = () => {
    setUpdateInfo(null);
  };

  useEffect(() => {
    // Log platform info for debugging
    logPlatformInfo();
    
    // CRITICAL DEBUG: Log app state
    console.log('🚀 App starting...');
    console.log('📱 Platform: web');
    console.log('🌐 Is Capacitor: false');
    console.log('📱 Is Mobile:', isMobile);
    console.log('👤 User:', user);
    console.log('⏳ Loading:', loading);
    
    // Debug localStorage
    console.log('💾 LocalStorage debug:', {
      token: localStorage.getItem('token') ? 'Token exists' : 'No token',
      tokenLength: localStorage.getItem('token')?.length || 0,
      allKeys: Object.keys(localStorage)
    });
    
    // SAFETY: Force set loading to false after 3 seconds to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ SAFETY: Force setting loading to false after 3s timeout');
        setLoading(false);
      }
    }, 3000);
    
    // Thêm class để hiển thị app ngay lập tức (ngăn flash)
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.add('app-ready');
      rootElement.classList.add('web-app');
    }
    
    // Khởi tạo copy protection
    initCopyProtection();
    preventDevTools();

    // Service Worker registration is handled in index.js to avoid duplicates
    if (isCapacitor()) {
      console.log('📱 Running as Capacitor native app - Service worker registration skipped');
    } else {
      console.log('📱 Running as PWA - Service worker registration handled in index.js');
    }

    // Request notification permission
    requestNotificationPermission();

    // Listen for PWA install prompt (Web/PWA only, not for Capacitor)
    if (!isCapacitor()) {
      const handleBeforeInstallPrompt = (e) => {
        console.log('beforeinstallprompt event fired');
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        window.deferredPrompt = e;
        
        // Auto-trigger install prompt only on Android web
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
          setTimeout(() => {
            if (window.deferredPrompt) {
              console.log('Auto-triggering install prompt on Android');
              window.deferredPrompt.prompt();
              window.deferredPrompt.userChoice.then((choiceResult) => {
                console.log('User choice:', choiceResult.outcome);
                if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt');
                } else {
                  console.log('User dismissed the install prompt');
                }
                window.deferredPrompt = null;
              });
            }
          }, 2000); // 2 second delay
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    } else {
      console.log('📱 Capacitor app - PWA install prompt disabled');
    }

    let token = getToken();
    console.log('🔍 Token check (localStorage):', token ? 'Token exists' : 'No token found');
    if (token) {
      console.log('🔍 Token length:', token.length, 'characters');
      console.log('🔍 Token preview:', token.substring(0, 30) + '...');
    }
    
    // DEBUG: Check all localStorage keys to see if token is being cleared
    const allKeys = Object.keys(localStorage);
    console.log('🔍 All localStorage keys:', allKeys);
    console.log('🔍 localStorage size:', localStorage.length, 'items');
    allKeys.forEach(key => {
      console.log(`🔍 localStorage['${key}']:`, localStorage.getItem(key)?.substring(0, 50));
    });
    
    // CRITICAL FOR iOS: If no token in localStorage, try to restore from IndexedDB
    if (!token) {
      console.log('⚠️ No token in localStorage, trying to restore from IndexedDB...');
      
      // Try async restore
      getTokenAsync().then(restoredToken => {
        if (restoredToken) {
          console.log('✅ Token restored from IndexedDB! Reloading...');
          window.location.reload();
        } else {
          console.log('❌ No token in any storage, showing login screen');
          // Let the app continue to show login screen
        }
      });
    }
    
    // DEBUG: Log user state
    console.log('👤 Current user state:', user);
    console.log('🔍 Will verify token?', token && !user);
    
    // CHỈ verify token khi app khởi động lần đầu, KHÔNG verify khi đang login
    if (token && !user) {
      // Verify token and get user info + Preload data
      const apiUrl = getApiBaseUrl();
      const loadStartTime = Date.now();
      
      console.log('🔐 Verifying existing token...', token.substring(0, 20) + '...');
      console.log('🌐 API URL:', apiUrl);
      
      // Add timeout và network check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      fetch(`${apiUrl}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      })
      .then(async (res) => {
        clearTimeout(timeoutId);
        console.log('📡 API Response status:', res.status);
        
        if (!res.ok) {
          // CRITICAL: Save status before throwing error
          const errorData = {
            status: res.status,
            statusText: res.statusText
          };
          throw errorData;
        }
        return await res.json();
      })
      .then(async (userData) => {
        if (userData && (userData.id || userData.userId)) {
          console.log('✅ Token valid, user loaded:', userData);
          setUser(userData);
          
          // Preload data trong khi splash screen hiển thị (1 giây)
          // Load song song nhiều request để tăng tốc độ
          setDataLoadingProgress(20);
          
          try {
            const [conversationsRes, friendsRes, postsRes, notificationsRes] = await Promise.all([
              fetch(`${apiUrl}/chat/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => null),
              
              fetch(`${apiUrl}/friends`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => null),
              
              fetch(`${apiUrl}/newsfeed/posts`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => null),
              
              fetch(`${apiUrl}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => null)
            ]);
            
            setDataLoadingProgress(50);
            
            const conversations = conversationsRes ? await conversationsRes.json().catch(() => []) : [];
            const friends = friendsRes ? await friendsRes.json().catch(() => []) : [];
            const posts = postsRes ? await postsRes.json().catch(() => []) : [];
            const notifications = notificationsRes ? await notificationsRes.json().catch(() => []) : [];
            
            setDataLoadingProgress(80);
            
            // Lưu preloaded data để các component khác sử dụng
            setPreloadedData({
              conversations: Array.isArray(conversations) ? conversations : conversations.conversations || [],
              friends: Array.isArray(friends) ? friends : friends.friends || [],
              posts: Array.isArray(posts) ? posts : posts.posts || [],
              notifications: Array.isArray(notifications) ? notifications : notifications.notifications || [],
              loadedAt: Date.now()
            });
            
            setDataLoadingProgress(100);
            
            console.log('✅ Preloaded data:', {
              conversations: conversations.length || (conversations.conversations?.length || 0),
              friends: friends.length || (friends.friends?.length || 0),
              posts: posts.length || (posts.posts?.length || 0),
              notifications: notifications.length || (notifications.notifications?.length || 0)
            });
          } catch (error) {
            console.error('❌ Error preloading data:', error);
            // Vẫn cho phép app chạy nếu preload failed
          }
        } else {
          console.log('⚠️ Invalid user data received, clearing state');
          clearUserState();
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('❌ Error loading user:', error);
        
        if (error.name === 'AbortError') {
          console.log('⏰ Request timeout - API server may be unreachable');
          console.log('🌐 Check if API server is running on:', apiUrl);
          console.log('🔍 Keeping token for now, will retry on next app start');
          // Don't clear token on timeout, just show login screen
          setUser(null);
        } else if (error.message && error.message.includes('Failed to fetch')) {
          // Network error - server might be down
          console.log('🌐 Network error - server may be unreachable');
          console.log('🔍 Keeping token for now, will retry on next app start');
          setUser(null);
        } else {
          // CRITICAL: Check error status from fetch
          const status = error.status;
          console.log('🔄 Error loading user, status:', status);
          console.log('🔍 Error details:', {
            status: status,
            message: error.message,
            name: error.name,
            errorObject: error
          });
          
          // TEMPORARY FIX: Don't remove token unless we're 100% sure it's unauthorized
          // Only remove token if we have a valid error status that indicates auth failure
          if (status && (status === 401 || status === 403)) {
            console.log('🔒 Unauthorized (401/403), removing token');
            removeToken();
          } else {
            console.log('⚠️ Non-auth error or unknown error type, keeping token for retry');
            console.log('⚠️ This might be network error, server down, or CORS issue');
          }
          setUser(null);
        }
      })
      .finally(() => {
        // Đảm bảo splash screen hiển thị ít nhất 2 giây (mượt mà)
        // CRITICAL: Có user đăng nhập rồi thì hiển thị splash mỗi khi mở app
        const loadDuration = Date.now() - loadStartTime;
        const minSplashTime = 1500; // 
        // 5 giây cho UX mượt mà
        const remainingTime = Math.max(0, minSplashTime - loadDuration);
        
        console.log(`⏱️ Loading took ${loadDuration}ms, waiting ${remainingTime}ms more`);
        
        setTimeout(() => {
          console.log('✅ Setting loading to false after token verification');
          setLoading(false);
          // Don't show download prompt if user is already logged in
        }, remainingTime);
      });
    } else {
      // Nếu không có token (chưa đăng nhập)
      // Kiểm tra xem có cần hiện download prompt không
      const isCapacitor = window.Capacitor !== undefined;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone === true;
      const hasClosedPrompt = localStorage.getItem('downloadPromptClosed');
      const shouldShowDownloadPrompt = isMobile && !isPWA && !hasClosedPrompt && !isCapacitor;
      
      if (shouldShowDownloadPrompt) {
        // Nếu cần hiện download prompt → bỏ qua splash screen
        console.log('⏱️ No token found, showing download prompt directly (skip splash)');
        setLoading(false);
        setShowDownloadPrompt(true);
      } else {
        // Nếu không cần download prompt → hiển thị splash screen bình thường
        console.log('⏱️ No token found, showing splash screen for minimum time');
        const elapsed = Date.now() - appStartTime;
        const minSplashTime = 1500; // 1.5 giây để hiển thị custom splash screen đẹp
        const remainingTime = Math.max(0, minSplashTime - elapsed);
        
        console.log(`⏱️ Elapsed: ${elapsed}ms, waiting ${remainingTime}ms more for splash`);
        
        setTimeout(() => {
          console.log('✅ Setting loading to false (no token)');
          setLoading(false);
        }, remainingTime);
      }
    }
    
    // Cleanup function
    return () => {
      clearTimeout(safetyTimeout);
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← QUAN TRỌNG: Chỉ chạy 1 lần khi mount, không phụ thuộc vào isLoggingIn

  const checkDownloadPrompt = () => {
    // Check if running in Capacitor native app
    const isCapacitor = window.Capacitor !== undefined;
    
    // Check if user is in PWA mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    // Check if user has already closed the prompt before
    const hasClosedPrompt = localStorage.getItem('downloadPromptClosed');
    
    // Only show download prompt on mobile, not in PWA/Capacitor, and hasn't been closed before
    if (isMobile && !isPWA && !hasClosedPrompt && !isCapacitor) {
      setShowDownloadPrompt(true);
    }
  };

  const handleDownloadPromptClose = () => {
    setShowDownloadPrompt(false);
    // Remember that user has closed the prompt
    localStorage.setItem('downloadPromptClosed', 'true');
  };

  const login = (userData, token) => {
    // Lưu token vào localStorage
    localStorage.setItem('token', token);
    
    // Lưu user data vào localStorage để persistence
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Tạo object mới để trigger re-render
    const newUserData = { ...userData };
    setUser(newUserData);
    setLoading(false); // Đảm bảo loading screen được tắt
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const clearUserState = () => {
    removeToken();
    setUser(null);
  };

  // CRITICAL: Kiểm tra Bundle Protection TRƯỚC tất cả
  if (bundleProtectionFailed) {
    return <BundleProtectionError />;
  }

  if (loading) {
    // CRITICAL: Show custom splash screen ONLY on mobile devices
    if (isMobile) {
      console.log('🔄 Showing custom splash screen (mobile only)...');
      return (
        <SplashScreen 
          isVisible={true}
          loadingProgress={dataLoadingProgress}
          onComplete={() => {
            console.log('✅ Splash screen completed');
            setLoading(false);
          }}
        />
      );
    } else {
      // PC: Show minimal loading (no splash screen)
      console.log('💻 PC device - skipping splash screen');
      return null;
    }
  }

  // Show download prompt on mobile ONLY when not logged in
  if (showDownloadPrompt && !user) {
    return (
      <AppDownloadPrompt 
        onClose={handleDownloadPromptClose}
      />
    );
  }

  // Tắt SplashScreen để tránh flash - load trực tiếp UI
  // (SplashScreen gây animation và delay không cần thiết)

  return (
    <ResponsiveWrapper>
      <ThemeProvider>
        <AuthContext.Provider value={{ user, login, logout, clearUserState, preloadedData }}>
          <Router>
            <div className="App">
            {/* Offline indicator */}
            {!isOnline && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                background: '#ff6b6b',
                color: 'white',
                padding: '8px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 9999
              }}>
                🔌 Không có kết nối internet
                {pendingCount > 0 && ` • ${pendingCount} tin nhắn đang chờ`}
              </div>
            )}
            
            <Routes>
              {/* Mobile Auth Routes - Tách biệt hoàn toàn cho Mobile */}
              <Route 
                path="/m/login" 
                element={!user ? <MobileLogin /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/m/register" 
                element={!user ? <MobileRegister /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/m/forgot-password" 
                element={!user ? <MobileForgotPassword /> : <Navigate to="/" replace />} 
              />
              
              {/* Mobile Terms Routes */}
              <Route 
                path="/m/terms" 
                element={<MobileTerms />} 
              />
              <Route 
                path="/m/social-terms" 
                element={<MobileSocialTerms />} 
              />
              
              {/* PC Auth Routes - Tách biệt hoàn toàn cho PC */}
              <Route 
                path="/login" 
                element={!user ? (isMobile ? <Navigate to="/m/login" replace /> : <Login />) : <Navigate to="/" replace />} 
              />
              <Route 
                path="/register" 
                element={!user ? (isMobile ? <Navigate to="/m/register" replace /> : <Register />) : <Navigate to="/" replace />} 
              />
              <Route 
                path="/forgot-password" 
                element={!user ? (isMobile ? <Navigate to="/m/forgot-password" replace /> : <ForgotPassword />) : <Navigate to="/" replace />} 
              />
              
              {/* Main Route - Auto detect device */}
              <Route 
                path="/" 
                element={user ? (isMobile ? <MobileChat /> : <DesktopChat />) : (isMobile ? <Navigate to="/m/login" replace /> : <Navigate to="/login" replace />)} 
              />
            </Routes>
            
            {/* PWA Components */}
            <InstallPrompt />
            
            {/* Live Update Prompt */}
            <UpdatePrompt
              updateInfo={updateInfo}
              onUpdate={handleUpdate}
              onSkip={handleSkipUpdate}
              isDownloading={isDownloadingUpdate}
              downloadProgress={updateProgress}
            />
            
            {/* Success Toast */}
            {showSuccessToast && (
              <SuccessToast
                title="Cập nhật thành công!"
                message="Ứng dụng sẽ được khởi động lại để áp dụng phiên bản mới."
                onClose={() => setShowSuccessToast(false)}
              />
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
            </div>
          </Router>
        </AuthContext.Provider>
      </ThemeProvider>
    </ResponsiveWrapper>
  );
}

export default App;

