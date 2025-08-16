'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Predefined credentials
const VALID_CREDENTIALS = {
  username: 'Hogwarts',
  password: 'HarryPoter@321'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('finance-auth-token');
    const loginTime = localStorage.getItem('finance-login-time');
    
    if (token && loginTime) {
      const currentTime = new Date().getTime();
      const sessionTime = parseInt(loginTime);
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      if (currentTime - sessionTime < sessionDuration) {
        setIsAuthenticated(true);
      } else {
        // Session expired, clear storage
        localStorage.removeItem('finance-auth-token');
        localStorage.removeItem('finance-login-time');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      const token = btoa(`${username}:${password}:${new Date().getTime()}`);
      localStorage.setItem('finance-auth-token', token);
      localStorage.setItem('finance-login-time', new Date().getTime().toString());
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('finance-auth-token');
    localStorage.removeItem('finance-login-time');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
