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
    try {
      const storedToken = await getStoredToken();
      
      if (storedToken) {
        setToken(storedToken);
        // Verify token and get user info
        await verifyToken(storedToken);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      // Use apiClient with configured timeout and interceptors
      const response = await apiClient.get('/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000, // 15 seconds timeout
      });

      if (response.data) {
        setUser(response.data);
      }
    } catch (error: any) {
      console.error('Token verification failed:', error);
      
      // Only remove token if it's an authentication error (401, 403)
      // Don't remove token for timeout errors - might be network issue
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token invalid, remove it
        await removeToken();
        setToken(null);
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        // Timeout error - don't remove token, just log it
        console.warn('Token verification timeout - network may be slow');
      } else {
        // Other errors - log but don't remove token
        console.warn('Token verification error - keeping token:', error.message);
      }
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

