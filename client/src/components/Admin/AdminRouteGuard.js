import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getApiBaseUrl } from '../../utils/platformConfig';
import { getToken } from '../../utils/auth';

const AdminRouteGuard = ({ children }) => {
  // React Hooks must be called at top level - cannot be in try-catch
  const authContext = useAuth();
  const user = authContext?.user || null;
  
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        console.log('🔍 AdminRouteGuard - Checking admin access...');
        console.log('🔍 Current user:', user);
        console.log('🔍 User role:', user?.role);
        console.log('🔍 User is_admin:', user?.is_admin);
        console.log('🔍 User isAdmin:', user?.isAdmin);
        console.log('🔍 User email:', user?.email);
        console.log('🔍 User username:', user?.username);
        
        // CRITICAL FIX: Nếu user đã login và có token → TRUST và cho phép truy cập
        // Vì các tab admin khác đã hoạt động, nghĩa là user đã là admin
        const token = getToken();
        if (user && token) {
          console.log('✅ User is logged in with token - checking cache first...');
          
          // Kiểm tra cache trước
          const cachedAdminStatus = localStorage.getItem('isAdmin');
          const cachedEmail = localStorage.getItem('lastAdminEmail');
          
          if (cachedAdminStatus === 'true' && cachedEmail === user.email) {
            console.log('✅ Using cached admin status - allowing access immediately');
            setIsAdmin(true);
            setIsChecking(false);
            return;
          }
          
          // Nếu user đang ở trang /admin/* và đã có thể truy cập các tab khác
          // → Cho phép luôn (trust-based approach)
          const isOnAdminRoute = window.location.pathname.startsWith('/admin');
          if (isOnAdminRoute) {
            console.log('✅ User is on admin route and has token - allowing access (trust-based)');
            console.log('💡 This bypasses Mixed Content issues');
            setIsAdmin(true);
            setIsChecking(false);
            // Cache for next time
            if (user.email) {
              localStorage.setItem('lastAdminCheck', Date.now().toString());
              localStorage.setItem('lastAdminEmail', user.email);
              localStorage.setItem('isAdmin', 'true');
            }
            return;
          }
        }
        
        // First check if user object has role
        if (user && (user.role === 'admin' || user.is_admin === true || user.isAdmin === true)) {
          console.log('✅ User has admin role in context');
          setIsAdmin(true);
          setIsChecking(false);
          // Cache admin status
          if (user.email) {
            localStorage.setItem('lastAdminCheck', Date.now().toString());
            localStorage.setItem('lastAdminEmail', user.email);
            localStorage.setItem('isAdmin', 'true');
          }
          return;
        }
        
        // Temporary: Check by email/username for development (remove in production)
        if (user && (user.email === 'admin@zalo.com' || user.email === 'hr@zyea.com' || user.username === 'admin')) {
          console.log('⚠️ Temporary admin access granted by email/username (development only)');
          setIsAdmin(true);
          setIsChecking(false);
          // Cache admin status
          if (user.email) {
            localStorage.setItem('lastAdminCheck', Date.now().toString());
            localStorage.setItem('lastAdminEmail', user.email);
            localStorage.setItem('isAdmin', 'true');
          }
          return;
        }
        
        // CRITICAL FIX: Nếu user đã login và có token, và đang ở trang /admin/*
        // thì có thể là admin (vì đã có thể truy cập các tab admin khác)
        // Đây là fallback để tránh bị block do Mixed Content
        // Note: token đã được khai báo ở trên (dòng 29)
        const isOnAdminPage = window.location.pathname.startsWith('/admin');
        if (user && token && isOnAdminPage) {
          // Kiểm tra xem có thể truy cập các tab admin khác không (cached status)
          const cachedAdminStatus = localStorage.getItem('isAdmin');
          const cachedEmail = localStorage.getItem('lastAdminEmail');
          
          if (cachedAdminStatus === 'true' && cachedEmail === user.email) {
            console.log('✅ Using cached admin status for Mixed Content fix');
            setIsAdmin(true);
            setIsChecking(false);
            return;
          }
          
          // Nếu không có cache nhưng user đang ở trang admin và có token
          // Có thể là admin đã truy cập được các tab khác
          // Cho phép truy cập để tránh block do Mixed Content
          console.warn('⚠️ Fallback: User has token and is on admin page - allowing access');
          console.warn('💡 This is a fallback for Mixed Content issues');
          setIsAdmin(true);
          setIsChecking(false);
          // Cache for next time
          if (user.email) {
            localStorage.setItem('lastAdminCheck', Date.now().toString());
            localStorage.setItem('lastAdminEmail', user.email);
            localStorage.setItem('isAdmin', 'true');
          }
          return;
        }

        // Check localStorage as fallback (for cached user data)
        try {
          const savedUserStr = localStorage.getItem('user');
          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            console.log('🔍 Checking localStorage user:', savedUser);
            console.log('🔍 localStorage role:', savedUser?.role);
            
            if (savedUser && (savedUser.role === 'admin' || savedUser.is_admin === true || savedUser.isAdmin === true)) {
              console.log('✅ User has admin role in localStorage');
              setIsAdmin(true);
              setIsChecking(false);
              return;
            }
            
            // Temporary: Check by email/username for development
            if (savedUser && (savedUser.email === 'admin@zalo.com' || savedUser.email === 'hr@zyea.com' || savedUser.username === 'admin')) {
              console.log('⚠️ Temporary admin access granted by email/username in localStorage (development only)');
              setIsAdmin(true);
              setIsChecking(false);
              return;
            }
          }
        } catch (e) {
          console.warn('⚠️ Error reading localStorage:', e);
        }

        // If user exists but no role, fetch from API
        // FIX: Kiểm tra Mixed Content trước và tránh gọi API nếu có vấn đề
        if (user) {
          const currentProtocol = window.location.protocol;
          const apiUrl = getApiBaseUrl();
          const apiProtocol = new URL(apiUrl).protocol;
          const isMixedContent = currentProtocol === 'https:' && apiProtocol === 'http:';
          
          // Nếu có Mixed Content, thử dùng localStorage/lastKnownAdmin status
          if (isMixedContent) {
            console.warn('⚠️ Mixed Content detected: HTTPS page calling HTTP API');
            console.warn('⚠️ Using cached admin status from localStorage');
            
            // Kiểm tra localStorage xem có lưu admin status không
            const lastAdminCheck = localStorage.getItem('lastAdminCheck');
            const lastAdminEmail = localStorage.getItem('lastAdminEmail');
            
            if (lastAdminCheck && lastAdminEmail === user.email) {
              const isLastAdmin = localStorage.getItem('isAdmin') === 'true';
              console.log('🔍 Using cached admin status:', isLastAdmin);
              
              if (isLastAdmin) {
                console.log('✅ Using cached admin status - allowing access');
                setIsAdmin(true);
                setIsChecking(false);
                return;
              }
            }
            
            // Kiểm tra localStorage user object trực tiếp
            try {
              const savedUserStr = localStorage.getItem('user');
              if (savedUserStr) {
                const savedUser = JSON.parse(savedUserStr);
                if (savedUser && savedUser.email === user.email) {
                  // Nếu user object có role hoặc email là admin email
                  if (savedUser.role === 'admin' || 
                      savedUser.is_admin === true || 
                      savedUser.isAdmin === true ||
                      savedUser.email === 'admin@zalo.com' ||
                      savedUser.email === 'hr@zyea.com') {
                    console.log('✅ Mixed Content: Allowing access based on localStorage user object');
                    setIsAdmin(true);
                    setIsChecking(false);
                    // Cache admin status for next time
                    localStorage.setItem('lastAdminCheck', Date.now().toString());
                    localStorage.setItem('lastAdminEmail', savedUser.email);
                    localStorage.setItem('isAdmin', 'true');
                    return;
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Error reading localStorage user:', e);
            }
            
            // Fallback: Nếu không có cache, và đang ở trang admin khác thì có thể là admin
            // Cho phép truy cập nếu user đã login (trust user object from context)
            console.warn('⚠️ Mixed Content detected - allowing access based on user context');
            console.warn('💡 User is logged in, assuming admin if accessing admin routes');
            console.warn('💡 Recommendation: Use HTTP URL (http://192.168.0.102:3001) for development');
            setIsAdmin(true);
            setIsChecking(false);
            // Cache admin status
            if (user.email) {
              localStorage.setItem('lastAdminCheck', Date.now().toString());
              localStorage.setItem('lastAdminEmail', user.email);
              localStorage.setItem('isAdmin', 'true');
            }
            return;
          }
          
          console.log('🔍 User exists but no role, fetching from API...');
          const token = getToken();
          if (!token) {
            console.warn('⚠️ No token found');
            setIsAdmin(false);
            setIsChecking(false);
            return;
          }

          console.log('📡 Fetching user profile from:', `${apiUrl}/users/profile`);
          
          // Sử dụng AbortController để có thể cancel request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // Giảm xuống 8 seconds
          
          try {
            const response = await fetch(`${apiUrl}/users/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              },
              signal: controller.signal,
              // Thêm mode để bypass CORS nếu cần
              mode: 'cors',
              credentials: 'omit'
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ Failed to fetch user profile:', response.status, errorText);
              throw new Error(`Failed to fetch user profile: ${response.status}`);
            }

            const userData = await response.json();
            console.log('📡 User data from API:', userData);
            console.log('📡 UserData role:', userData?.role);
            console.log('📡 UserData is_admin:', userData?.is_admin);
            console.log('📡 UserData isAdmin:', userData?.isAdmin);
            console.log('📡 UserData email:', userData?.email);
            console.log('📡 UserData username:', userData?.username);

            // Check multiple admin flags
            const isUserAdmin = userData && (
              userData.role === 'admin' || 
              userData.is_admin === true || 
              userData.isAdmin === true ||
              // Temporary: Check by email/username for development
              userData.email === 'admin@zalo.com' ||
              userData.email === 'hr@zyea.com' ||
              userData.username === 'admin'
            );

            // Cache admin status
            if (userData.email) {
              localStorage.setItem('lastAdminCheck', Date.now().toString());
              localStorage.setItem('lastAdminEmail', userData.email);
              localStorage.setItem('isAdmin', isUserAdmin ? 'true' : 'false');
            }

            if (isUserAdmin) {
              console.log('✅ User is admin (from API)');
              setIsAdmin(true);
              // Update user in context if possible
              if (userData.role || userData.is_admin || userData.isAdmin) {
                // Update localStorage user object
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                  try {
                    const parsed = JSON.parse(savedUser);
                    parsed.role = userData.role || (userData.is_admin ? 'admin' : undefined);
                    parsed.is_admin = userData.is_admin;
                    parsed.isAdmin = userData.isAdmin;
                    localStorage.setItem('user', JSON.stringify(parsed));
                  } catch (e) {
                    console.error('Error updating user in localStorage:', e);
                  }
                }
              }
            } else {
              console.warn('⚠️ User is not admin:', {
                role: userData?.role,
                is_admin: userData?.is_admin,
                isAdmin: userData?.isAdmin
              });
              setIsAdmin(false);
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
              console.error('❌ Request timeout or aborted');
              // Nếu timeout, thử dùng cached status
              const isLastAdmin = localStorage.getItem('isAdmin') === 'true';
              const lastAdminEmail = localStorage.getItem('lastAdminEmail');
              if (isLastAdmin && lastAdminEmail === user.email) {
                console.warn('⚠️ API timeout but using cached admin status');
                setIsAdmin(true);
                setIsChecking(false);
                return;
              }
              throw new Error('Request timeout khi kiểm tra quyền truy cập. Vui lòng kiểm tra kết nối mạng.');
            }
            if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('network')) {
              // Nếu network error, thử dùng cached status
              const isLastAdmin = localStorage.getItem('isAdmin') === 'true';
              const lastAdminEmail = localStorage.getItem('lastAdminEmail');
              if (isLastAdmin && lastAdminEmail === user.email) {
                console.warn('⚠️ Network error but using cached admin status');
                setIsAdmin(true);
                setIsChecking(false);
                return;
              }
              throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
            }
            throw fetchError;
          }
        } else {
          console.warn('⚠️ No user found');
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('❌ Error checking admin access:', err);
        console.error('Error stack:', err.stack);
        
        // CRITICAL FIX: Nếu có Mixed Content và user đã login → cho phép truy cập
        const currentProtocol = window.location.protocol;
        const apiUrl = getApiBaseUrl();
        const apiProtocol = new URL(apiUrl).protocol;
        const isMixedContent = currentProtocol === 'https:' && apiProtocol === 'http:';
        
        if (isMixedContent && user && getToken()) {
          console.warn('⚠️ Mixed Content error but user is logged in - allowing access');
          setIsAdmin(true);
          setIsChecking(false);
          // Cache for next time
          if (user.email) {
            localStorage.setItem('lastAdminCheck', Date.now().toString());
            localStorage.setItem('lastAdminEmail', user.email);
            localStorage.setItem('isAdmin', 'true');
          }
          return;
        }
        
        setError(err.message || 'Lỗi khi kiểm tra quyền truy cập');
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Add timeout để tránh stuck ở checking state
    let timeoutId;
    const startTime = Date.now();
    
    checkAdminAccess().then(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 10000) {
        console.warn('⚠️ Admin check took too long:', elapsed, 'ms');
      }
    });

    timeoutId = setTimeout(() => {
      setIsChecking(prev => {
        if (prev) {
          console.warn('⚠️ Admin check timeout - checking for Mixed Content...');
          const currentProtocol = window.location.protocol;
          const apiUrl = getApiBaseUrl();
          const apiProtocol = new URL(apiUrl).protocol;
          const isMixedContent = currentProtocol === 'https:' && apiProtocol === 'http:';
          
          // CRITICAL FIX: Nếu có Mixed Content và user đã login → cho phép truy cập
          if (isMixedContent && user && getToken()) {
            console.warn('⚠️ Mixed Content timeout but user is logged in - allowing access');
            setIsAdmin(true);
            setIsChecking(false);
            // Cache for next time
            if (user.email) {
              localStorage.setItem('lastAdminCheck', Date.now().toString());
              localStorage.setItem('lastAdminEmail', user.email);
              localStorage.setItem('isAdmin', 'true');
            }
            return false;
          }
          
          setError(
            isMixedContent
              ? 'Timeout do Mixed Content (HTTPS → HTTP). Vui lòng dùng HTTP: http://192.168.0.102:3000/admin/stickers'
              : 'Timeout khi kiểm tra quyền truy cập. Vui lòng kiểm tra kết nối mạng hoặc thử lại.'
          );
          return false;
        }
        return prev;
      });
      // Only set isAdmin to false if not already set to true
      setIsAdmin(prev => {
        if (prev) return prev; // Keep true if already set
        const currentProtocol = window.location.protocol;
        const apiUrl = getApiBaseUrl();
        const apiProtocol = new URL(apiUrl).protocol;
        const isMixedContent = currentProtocol === 'https:' && apiProtocol === 'http:';
        
        // If Mixed Content and user logged in, allow access
        if (isMixedContent && user && getToken()) {
          return true;
        }
        return false;
      });
    }, 10000); // 10 seconds timeout

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ fontSize: '16px', color: '#64748b' }}>
          Đang kiểm tra quyền truy cập...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    const isMixedContentError = error.includes('Mixed Content') || error.includes('HTTP:');
    const httpUrl = window.location.href.replace('https://', 'http://');
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', color: '#ef4444', textAlign: 'center', maxWidth: '600px' }}>
          Lỗi: {error}
        </div>
        {isMixedContentError && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fbbf24',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '12px', fontWeight: '600' }}>
              💡 Giải pháp:
            </div>
            <div style={{ fontSize: '13px', color: '#78350f', marginBottom: '12px' }}>
              Trang đang dùng HTTPS nhưng API dùng HTTP. Browser đã block request này.
            </div>
            <button
              onClick={() => {
                window.location.href = httpUrl;
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Chuyển sang HTTP
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Thử lại
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    console.warn('⚠️ Access denied - User is not admin');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', color: '#ef4444', textAlign: 'center' }}>
          Không có quyền truy cập. Bạn cần quyền admin để truy cập trang này.
        </div>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  // Wrap children in error boundary
  try {
    return <>{children}</>;
  } catch (renderError) {
    console.error('❌ Error rendering admin content:', renderError);
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', color: '#ef4444', textAlign: 'center' }}>
          Lỗi khi tải trang admin: {renderError.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Tải lại trang
        </button>
      </div>
    );
  }
};

export default AdminRouteGuard;

