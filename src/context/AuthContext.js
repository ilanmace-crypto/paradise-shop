import React, { createContext, useState, useContext } from 'react';
import { sendOrderNotification } from '../services/telegram';
import { useUser } from './UserContext';
import { login as apiLogin } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (username, password) => {
    try {
      const cleanUsername = (username || '').trim();
      const cleanPassword = String(password || '').trim();
      
      if (!cleanUsername) {
        return { success: false, error: 'Имя пользователя обязательно' };
      }
      
      if (!cleanPassword) {
        return { success: false, error: 'Пароль обязателен' };
      }
      
      console.log('Attempting login with:', { 
        username: cleanUsername,
        passwordLength: cleanPassword.length 
      });
      
      const result = await apiLogin(cleanUsername, cleanPassword);
      console.log('Login response:', result);

      if (result?.success && result.user?.role === 'admin') {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setUser(result.user);
        return { success: true };
      }

      return { 
        success: false, 
        error: result?.error || 'Неверное имя пользователя или пароль'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Ошибка при входе. Пожалуйста, попробуйте еще раз.'
      };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    isAdmin,
    user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
