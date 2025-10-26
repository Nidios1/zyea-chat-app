import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import styled from 'styled-components';

import AuthContext from './contexts/AuthContext';
import FacebookTopBar from './components/FacebookTopBar';
import NewsFeed from './components/NewsFeed/NewsFeed';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { getToken, removeToken } from './utils/auth';
import { getApiBaseUrl } from './utils/platformConfig';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: calc(var(--vh, 1vh) * 100);
  overflow: hidden;
  background: #f8f9fa;
`;

const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
`;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    // Set viewport height for mobile
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    
    // Hide splash screen
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({
        fadeOutDuration: 300
      }).catch(err => console.log('Splash hide error:', err));
    }

    // Verify token
    const token = getToken();
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('resize', setVH);
  }, []);

  const verifyToken = async (token) => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      const userData = await response.json();
      setUser(userData);
      
      // Load unread messages count
      loadUnreadMessagesCount(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      removeToken();
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadMessagesCount = async (token) => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token || getToken()}`
        }
      });

      if (response.ok) {
        const conversations = await response.json();
        const unread = conversations.reduce((total, conv) => {
          return total + (conv.unread_count || conv.unreadCount || 0);
        }, 0);
        setUnreadMessagesCount(unread);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  };

  // Refresh unread count every 30 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadUnreadMessagesCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    loadUnreadMessagesCount(token);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setUnreadMessagesCount(0);
  };

  if (loading) {
    return (
      <LoadingScreen>
        Đang tải...
      </LoadingScreen>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <AppContainer>
          <Routes>
            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/" />} 
            />
            <Route 
              path="/register" 
              element={!user ? <Register /> : <Navigate to="/" />} 
            />

            {/* Main Route */}
            <Route 
              path="/" 
              element={
                user ? (
                  <>
                    <FacebookTopBar 
                      unreadMessagesCount={unreadMessagesCount}
                      onSearchClick={() => alert('Tìm kiếm đang được phát triển')}
                    />
                    <MainContent>
                      <NewsFeed 
                        currentUser={user}
                        showBottomNav={false}
                      />
                    </MainContent>
                  </>
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>

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
        </AppContainer>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;

