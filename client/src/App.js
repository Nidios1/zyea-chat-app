import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Capacitor } from '@capacitor/core';
import { SplashScreen as CapacitorSplash } from '@capacitor/splash-screen';

import AuthContext from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ResponsiveWrapper from './components/Common/ResponsiveWrapper';
import Login from './components/Auth/Login';
import MobileLogin from './components/Mobile/MobileLogin';
import MobileRegister from './components/Mobile/MobileRegister';
import MobileForgotPassword from './components/Mobile/MobileForgotPassword';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import DesktopChat from './components/Desktop/DesktopChat';
import MobileChat from './components/Mobile/MobileChat';
import SplashScreen from './components/Loading/SplashScreen';
import AppDownloadPrompt from './components/Loading/AppDownloadPrompt';
import InstallPrompt from './components/Common/InstallPrompt';
import UpdatePrompt from './components/Common/UpdatePrompt';
import SuccessToast from './components/Common/SuccessToast';
// import PerformanceMonitor from './components/Common/PerformanceMonitor';
import { getToken, removeToken } from './utils/auth';
import { initCopyProtection, preventDevTools } from './utils/copyProtection';
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
    
    // Thêm class để hiển thị app ngay lập tức (ngăn flash)
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.add('app-ready');
      
      // Add platform-specific classes
      if (isCapacitor()) {
        rootElement.classList.add('capacitor-app');
        if (Capacitor.getPlatform() === 'ios') {
          rootElement.classList.add('ios-app');
        } else if (Capacitor.getPlatform() === 'android') {
          rootElement.classList.add('android-app');
        }
        
        // Ẩn Capacitor splash screen mặc định ngay lập tức
        // Để sử dụng custom splash screen
        CapacitorSplash.hide({
          fadeOutDuration: 0
        }).catch(err => console.log('Splash hide error:', err));
      } else {
        rootElement.classList.add('web-app');
      }
    }
    
    // Khởi tạo copy protection
    const cleanupCopyProtection = initCopyProtection();
    preventDevTools();

    // Register service worker ONLY for PWA (not for Capacitor native apps)
    if ('serviceWorker' in navigator && !isCapacitor()) {
      console.log('📱 Running as PWA - Registering service worker...');
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user to refresh
                if (window.confirm('Có phiên bản mới của ứng dụng. Bạn có muốn cập nhật?')) {
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    } else if (isCapacitor()) {
      console.log('📱 Running as Capacitor native app - Skipping service worker');
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

    const token = getToken();
    // CHỈ verify token khi app khởi động lần đầu, KHÔNG verify khi đang login
    if (token && !user) {
      // Verify token and get user info + Preload data
      const apiUrl = getApiBaseUrl();
      const loadStartTime = Date.now();
      
      console.log('🔐 Verifying existing token...');
      
      fetch(`${apiUrl}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
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
        console.error('❌ Error loading user:', error);
        console.log('🔄 Token invalid or expired, clearing state');
        clearUserState();
      })
      .finally(() => {
        // Đảm bảo splash screen hiển thị ít nhất 1 giây (mượt mà)
        const loadDuration = Date.now() - loadStartTime;
        const remainingTime = Math.max(0, 1000 - loadDuration);
        
        console.log(`⏱️ Loading took ${loadDuration}ms, waiting ${remainingTime}ms more`);
        
        setTimeout(() => {
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
        const minSplashTime = 1200; // 1.2 giây
        const remainingTime = Math.max(0, minSplashTime - elapsed);
        
        console.log(`⏱️ Elapsed: ${elapsed}ms, waiting ${remainingTime}ms more for splash`);
        
        setTimeout(() => {
          setLoading(false);
        }, remainingTime);
      }
    }
    
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
    console.log('🔐 Login called with user:', userData);
    localStorage.setItem('token', token);
    
    // Tạo object mới để trigger re-render
    const newUserData = { ...userData };
    setUser(newUserData);
    setLoading(false); // Đảm bảo loading screen được tắt
    console.log('✅ User logged in successfully');
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const clearUserState = () => {
    removeToken();
    setUser(null);
  };

  if (loading) {
    // Chỉ hiển thị SplashScreen đẹp trên mobile, PC hiển thị loading đơn giản
    if (isMobile) {
      return <SplashScreen isVisible={true} loadingProgress={dataLoadingProgress} />;
    }
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading... {dataLoadingProgress > 0 && `${dataLoadingProgress}%`}
      </div>
    );
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
              
              {/* PC Auth Routes - Tách biệt hoàn toàn cho PC */}
              <Route 
                path="/login" 
                element={!user ? (isMobile ? <Navigate to="/m/login" /> : <Login />) : <Navigate to="/" />} 
              />
              <Route 
                path="/register" 
                element={!user ? (isMobile ? <Navigate to="/m/register" /> : <Register />) : <Navigate to="/" />} 
              />
              <Route 
                path="/forgot-password" 
                element={!user ? (isMobile ? <Navigate to="/m/forgot-password" /> : <ForgotPassword />) : <Navigate to="/" />} 
              />
              
              {/* Main Route - Auto detect device */}
              <Route 
                path="/" 
                element={user ? (isMobile ? <MobileChat /> : <DesktopChat />) : (isMobile ? <Navigate to="/m/login" /> : <Navigate to="/login" />)} 
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

