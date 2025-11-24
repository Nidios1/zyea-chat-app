import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // React Hooks must be called at top level - cannot be in try-catch
  const authContext = useAuth();
  const user = authContext?.user || null;
  const logout = authContext?.logout || (() => {});

  // State để quản lý sidebar mở/đóng
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Lưu trạng thái vào localStorage
    const saved = localStorage.getItem('adminSidebarOpen');
    return saved ? JSON.parse(saved) : true;
  });

  // State để detect window size
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Lưu trạng thái sidebar vào localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('adminSidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Trên mobile, mặc định đóng sidebar khi resize
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug: Log user info
  React.useEffect(() => {
    console.log('🔍 AdminLayout - User info:', { user, role: user?.role });
    // Note: AdminRouteGuard already handles access control, so we just log here
  }, [user]);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Quản lý Users', icon: '👥' },
    { path: '/admin/posts', label: 'Quản lý Posts', icon: '📝' },
    { path: '/admin/stickers', label: 'Quản lý Stickers', icon: '🎨' },
    { path: '/admin/activity', label: 'Hoạt động', icon: '🔔' },
    { path: '/admin/system-notifications', label: 'Thông báo hệ thống', icon: '📢' },
  ];

  const handleLogout = () => {
    try {
      if (logout) {
        logout();
      }
      navigate('/login');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still navigate to login even if logout fails
      navigate('/login');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5', position: 'relative' }}>
      {/* Overlay cho mobile khi sidebar mở */}
      {sidebarOpen && isMobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '250px' : '0',
        backgroundColor: '#1e293b',
        color: 'white',
        padding: sidebarOpen ? '20px' : '0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        transition: 'width 0.3s ease, padding 0.3s ease',
        overflow: 'hidden',
        position: isMobile ? 'fixed' : 'relative',
        height: isMobile ? '100vh' : 'auto',
        zIndex: 999,
        left: isMobile ? (sidebarOpen ? '0' : '-250px') : '0',
        transition: isMobile 
          ? 'left 0.3s ease' 
          : 'width 0.3s ease, padding 0.3s ease'
      }}>
        <div style={{ 
          marginBottom: '30px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Admin Panel</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#94a3b8' }}>Zalo Clone</p>
        </div>

        <nav style={{ 
          flex: 1,
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.2s ease',
          overflow: 'hidden'
        }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // Đóng sidebar trên mobile khi click vào menu item
                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 15px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? 'white' : '#cbd5e1',
                  backgroundColor: isActive ? '#3b82f6' : 'transparent',
                  transition: 'all 0.2s',
                  fontSize: '15px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.target.style.backgroundColor = '#334155';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ marginRight: '10px', fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: sidebarOpen ? '15px' : '0',
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          marginTop: '20px',
          opacity: sidebarOpen ? 1 : 0,
          transition: 'opacity 0.2s ease, padding 0.3s ease',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Đăng nhập với</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name || user?.username || 'Admin'}
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s ease' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px 30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-around',
              width: '30px',
              height: '30px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              zIndex: 1000,
              position: 'relative'
            }}
            aria-label="Toggle sidebar"
          >
            <span style={{
              width: '25px',
              height: '3px',
              background: '#1e293b',
              borderRadius: '3px',
              transition: 'all 0.3s ease',
              transform: sidebarOpen ? 'rotate(45deg) translate(8px, 8px)' : 'none',
              transformOrigin: '1px'
            }} />
            <span style={{
              width: '25px',
              height: '3px',
              background: '#1e293b',
              borderRadius: '3px',
              transition: 'all 0.3s ease',
              opacity: sidebarOpen ? 0 : 1,
              transform: sidebarOpen ? 'translateX(-20px)' : 'none'
            }} />
            <span style={{
              width: '25px',
              height: '3px',
              background: '#1e293b',
              borderRadius: '3px',
              transition: 'all 0.3s ease',
              transform: sidebarOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none',
              transformOrigin: '1px'
            }} />
          </button>
          
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b', flex: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
          </h1>
        </div>

        <div style={{ flex: 1, padding: '30px', overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

