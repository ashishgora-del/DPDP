import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  primaryRole: string;
  role?: string; // For backward compatibility - will be same as primaryRole
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
  bio?: string;
  avatarUrl?: string;
  [key: string]: any; // Allow additional properties for compatibility
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  primaryRole?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and user on mount
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Verify token is still valid by fetching profile
        authApi.getProfile()
          .then(response => {
            const userData = { ...response.data, role: response.data.primaryRole };
            setUser(userData);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
          })
          .catch(() => {
            // Token invalid, clear auth
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_KEY);
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authApi.login(data);
      const { accessToken, user: userData } = response.data;
      const userWithRole = { ...userData, role: userData.primaryRole };

      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userWithRole));
      setUser(userWithRole);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      const { accessToken, user: userData } = response.data;
      const userWithRole = { ...userData, role: userData.primaryRole };

      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userWithRole));
      setUser(userWithRole);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AUTH_TOKEN_KEY, AUTH_USER_KEY };
