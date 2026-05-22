import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  phone?: string;
  avatar?: string;
  vendor_profile?: any; // populated if role === 'vendor'
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: ('customer' | 'vendor' | 'admin')[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    const accessToken = localStorage.getItem('suga_access_token');
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<User>('auth/me/');
      setUser(response.data);
    } catch (error) {
      console.error('Auth verification failed', error);
      // Clean up tokens if the verification request fails with auth issues
      localStorage.removeItem('suga_access_token');
      localStorage.removeItem('suga_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await api.post<{ access: string; refresh: string }>('auth/login/', {
        username,
        password,
      });
      
      const { access, refresh } = response.data;
      localStorage.setItem('suga_access_token', access);
      localStorage.setItem('suga_refresh_token', refresh);
      
      // Fetch user profile info
      const meResponse = await api.get<User>('auth/me/');
      setUser(meResponse.data);
      setLoading(false);
      return meResponse.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('suga_access_token');
    localStorage.removeItem('suga_refresh_token');
    setUser(null);
  };

  const hasRole = (roles: ('customer' | 'vendor' | 'admin')[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        checkAuth,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
