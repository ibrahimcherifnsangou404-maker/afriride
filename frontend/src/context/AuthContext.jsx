/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return authService.getCurrentUser();
  });
  const loading = false;

  const refreshUser = async () => {
    try {
      const profileResponse = await authService.getProfile();
      const profile = profileResponse?.data;
      if (profile) {
        localStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);
      }
      return profile || null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    refreshUser();
  }, []);

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'inscription'
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      refreshUser();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la connexion'
      };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await authService.googleLogin(idToken);
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      refreshUser();
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la connexion Google'
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const setToken = (token, userData = null) => {
    localStorage.setItem('token', token);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    googleLogin,
    logout,
    setToken,
    refreshUser,
    isAuthenticated: !!user && !!localStorage.getItem('token')
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
