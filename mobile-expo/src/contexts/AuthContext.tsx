import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getStoredToken, 
  storeToken, 
  removeToken,
  getStoredAccounts,
  storeAccounts,
  addAccount,
  removeAccount,
  getCurrentAccountId,
  setCurrentAccountId,
  type AccountData
} from '../utils/auth';
import apiClient from '../utils/api';
import { API_BASE_URL, STORAGE_KEYS } from '../config/constants';
import { queryClient } from '../utils/queryClient';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  banner_url?: string; // User banner/cover image
  email?: string;
  bio?: string; // User bio/description
  role?: string; // User role: 'admin', 'user', etc.
  is_admin?: boolean; // Admin flag
  isAdmin?: boolean; // Alternative admin flag (camelCase)
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  accounts: AccountData[];
  login: (userData: User, token: string) => Promise<void>;
  logout: (logoutAllAccounts?: boolean) => Promise<void>;
  switchAccount: (account: AccountData) => Promise<void>;
  removeAccountFromList: (accountId: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    // Reduced minimum splash screen display time for faster app startup
    const MIN_SPLASH_TIME = 500; // 0.5 seconds - instant startup
    const startTime = Date.now();
    
    // Set maximum timeout for auth initialization (reduced for faster failure)
    const MAX_INIT_TIMEOUT = 3000; // 3 seconds - no delay
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Auth initialization timeout - proceeding without verification');
      setLoading(false);
    }, MAX_INIT_TIMEOUT);
    
    try {
      // Load accounts list - đảm bảo luôn là array
      const storedAccounts = await getStoredAccounts();
      setAccounts(Array.isArray(storedAccounts) ? storedAccounts : []);
      
      const storedToken = await getStoredToken();
      
      if (storedToken) {
        setToken(storedToken);
        // Verify token and get user info (with timeout protection)
        // Use Promise.race to ensure we don't wait too long
        await Promise.race([
          verifyToken(storedToken),
          new Promise((resolve) => setTimeout(resolve, MAX_INIT_TIMEOUT - 500))
        ]);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      clearTimeout(timeoutId);
      
      // Ensure splash screen displays for at least MIN_SPLASH_TIME
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setLoading(false);
    }
  };

  const verifyToken = async (token: string, retryCount = 0) => {
    const MAX_RETRIES = 1; // Reduced to 1 retry to avoid long wait
    const RETRY_DELAY = 500; // 0.5 second - instant retry
    const REQUEST_TIMEOUT = 3000; // 3 seconds per request - no delay
    
    try {
      console.log(`🔐 Verifying token... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      console.log(`🌐 API URL: ${API_BASE_URL}`);
      
      // Use apiClient with shorter timeout for faster failure detection
      const response = await apiClient.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: REQUEST_TIMEOUT, // 3 seconds timeout for instant response
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
      // Set user và token trước để component có thể sử dụng ngay
      setToken(authToken);
      setUser(userData);
      await storeToken(authToken);
      
      // Đảm bảo loading state được clear
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      // Clear state nếu có lỗi
      setToken(null);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const logout = async (logoutAllAccounts: boolean = false) => {
    try {
      // Clear query cache trước để tránh component cố truy cập data sau khi logout
      try {
        queryClient.clear();
      } catch (error) {
        console.error('Error clearing query cache:', error);
      }
      
      // Clear token và user state (quan trọng nhất)
      await removeToken();
      setToken(null);
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Đảm bảo state được clear ngay cả khi có lỗi
      try {
        queryClient.clear();
      } catch (clearError) {
        console.error('Error clearing query cache on error:', clearError);
      }
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const switchAccount = async (account: AccountData) => {
    try {
      // Clear query cache trước khi switch account
      try {
        queryClient.clear();
      } catch (error) {
        console.error('Error clearing query cache on switch account:', error);
      }
      
      await storeToken(account.token);
      setToken(account.token);
      setUser({
        id: account.id,
        username: account.username,
        full_name: account.full_name,
        avatar_url: account.avatar_url,
        email: account.email,
      });
      await setCurrentAccountId(account.id);
      setLoading(false);
      
      // Update account last login
      const updatedAccounts = await getStoredAccounts();
      const accountIndex = updatedAccounts.findIndex(acc => acc.id === account.id);
      if (accountIndex !== -1) {
        updatedAccounts[accountIndex].lastLogin = new Date().toISOString();
        await storeAccounts(updatedAccounts);
        setAccounts(Array.isArray(updatedAccounts) ? updatedAccounts : []);
      }
      
      // Verify token
      await verifyToken(account.token);
    } catch (error) {
      console.error('Switch account error:', error);
      // Clear state nếu có lỗi
      setToken(null);
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const removeAccountFromList = async (accountId: string) => {
    try {
      await removeAccount(accountId);
      const updatedAccounts = await getStoredAccounts();
      setAccounts(Array.isArray(updatedAccounts) ? updatedAccounts : []);
      
      // If removed account is current account, logout
      if (user?.id === accountId) {
        await logout(true);
      }
    } catch (error) {
      console.error('Remove account error:', error);
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshUser = async () => {
    try {
      const currentToken = await getStoredToken();
      if (currentToken) {
        await verifyToken(currentToken);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        accounts,
        login,
        logout,
        switchAccount,
        removeAccountFromList,
        updateUser,
        refreshUser,
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

