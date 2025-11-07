import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredToken, storeToken, removeToken } from '../utils/auth';
import apiClient from '../utils/api';
import { API_BASE_URL } from '../config/constants';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    // Set maximum timeout for auth initialization (10 seconds)
    // This prevents app from hanging indefinitely if server is down
    const MAX_INIT_TIMEOUT = 10000; // 10 seconds
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Auth initialization timeout - proceeding without verification');
      setLoading(false);
    }, MAX_INIT_TIMEOUT);
    
    try {
      const storedToken = await getStoredToken();
      
      if (storedToken) {
        setToken(storedToken);
        // Verify token and get user info (with timeout protection)
        await verifyToken(storedToken);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const verifyToken = async (token: string, retryCount = 0) => {
    const MAX_RETRIES = 1; // Reduced to 1 retry to avoid long wait
    const RETRY_DELAY = 2000; // 2 seconds
    const REQUEST_TIMEOUT = 8000; // 8 seconds per request (reduced from 30s)
    
    try {
      console.log(`🔐 Verifying token... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      console.log(`🌐 API URL: ${API_BASE_URL}`);
      
      // Use apiClient with shorter timeout for faster failure detection
      const response = await apiClient.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: REQUEST_TIMEOUT, // 8 seconds timeout (reduced for faster response)
      });

      if (response.data) {
        console.log('✅ Token verified successfully');
        setUser(response.data);
      }
    } catch (error: any) {
      const isTimeout = error.code === 'ECONNABORTED' || 
                       error.message?.includes('timeout') ||
                       error.message?.includes('exceeded');
      
      const isNetworkError = error.code === 'ERR_NETWORK' || 
                            error.code === 'ECONNREFUSED' ||
                            error.message?.includes('Network Error');
      
      // Retry logic for timeout/network errors (only once)
      if ((isTimeout || isNetworkError) && retryCount < MAX_RETRIES) {
        console.warn(`⚠️ Token verification failed (${error.message}), retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return verifyToken(token, retryCount + 1);
      }
      
      // Only log error if it's not a timeout/network error (to avoid console spam)
      if (!isTimeout && !isNetworkError) {
        console.error('❌ Token verification failed:', error.message);
      } else {
        console.warn('⚠️ Token verification timeout/network error - server may be down, keeping token for offline use');
      }
      
      // Only remove token if it's an authentication error (401, 403)
      // Don't remove token for timeout/network errors - might be network issue
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('🔓 Token invalid or expired, removing...');
        await removeToken();
        setToken(null);
        setUser(null);
      }
      // For timeout/network errors, keep the token so user can use app offline
      // The token will be verified again when network is available
    }
  };

  const login = async (userData: User, authToken: string) => {
    try {
      await storeToken(authToken);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await removeToken();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
        loading: Boolean(loading),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

