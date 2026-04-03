/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    if (!localStorage.getItem('token')) return null;
    return authService.getCurrentUser();
  });
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  const refreshUser = async () => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const profileResponse = await authService.getProfile();
      const profile = profileResponse?.data;
      if (profile) {
        localStorage.setItem('user', JSON.stringify(profile));
        setUser(profile);
      }
      return profile || null;
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    refreshUser();
  }, [authToken]);

  const syncLocalAuthState = (fallbackUser = null) => {
    const storedToken = localStorage.getItem('token');
    const currentUser = authService.getCurrentUser() || fallbackUser;

    setAuthToken(storedToken);
    setUser(currentUser);
    return currentUser;
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const authData = response?.data ?? null;
      syncLocalAuthState(authData);
      return { success: true, data: authData, message: response?.message };
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
      const authData = response?.data ?? null;
      syncLocalAuthState(authData);
      refreshUser();
      return { success: true, data: authData, message: response?.message };
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
      const authData = response?.data ?? null;
      syncLocalAuthState(authData);
      refreshUser();
      return { success: true, data: authData, message: response?.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la connexion Google'
      };
    }
  };

  const verifyEmailCode = async ({ email, code }) => {
    try {
      const response = await authService.verifyEmailCode({ email, code });
      const authData = response?.data ?? null;
      syncLocalAuthState(authData?.user ?? authData);
      refreshUser();
      return { success: true, data: authData, message: response?.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors de la verification du code'
      };
    }
  };

  const resendEmailCode = async (email) => {
    try {
      const response = await authService.resendEmailCode(email);
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur lors du renvoi du code'
      };
    }
  };

  const logout = () => {
    authService.logout();
    setAuthToken(null);
    setUser(null);
    setLoading(false);
  };

  const updateUser = (nextUser) => {
    if (!nextUser) {
      localStorage.removeItem('user');
      setUser(null);
      return;
    }

    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const setToken = (token, userData = null) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
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
    verifyEmailCode,
    resendEmailCode,
    logout,
    setToken,
    updateUser,
    refreshUser,
    isAuthenticated: !!authToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
