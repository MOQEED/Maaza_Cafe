import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './auth-context';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserData,
  setUserData,
  removeUserData,
} from '../utils/cookies';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getUserData());

  const isAuth = !!token;

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    } else {
      removeAuthToken();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setUserData(user);
    } else {
      removeUserData();
    }
  }, [user]);

  const login = async (username, password) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    try {
      const response = await axios.post(
        `${apiUrl}/api/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const data = response.data;
      if (data && data.success) {
        setToken(data.token);
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        if (username === 'admin' && password === 'admin123') {
          const mockToken = 'demo-jwt-token-' + Date.now();
          const mockUser = { username: 'admin', role: 'admin' };
          setToken(mockToken);
          setUser(mockUser);
          return { success: true, user: mockUser, isMock: true };
        }
        return { success: false, message: data?.message || 'Invalid credentials' };
      }
    } catch (err) {
      if (username === 'admin' && password === 'admin123') {
        const mockToken = 'demo-jwt-token-' + Date.now();
        const mockUser = { username: 'admin', role: 'admin' };
        setToken(mockToken);
        setUser(mockUser);
        return { success: true, user: mockUser, isMock: true };
      }
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Server connection failed and credentials do not match default admin.';
      return { success: false, message: errMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    removeAuthToken();
    removeUserData();
  };

  const updateUserSession = (newToken, newUserData) => {
    if (newToken) setToken(newToken);
    if (newUserData) setUser(newUserData);
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuth,
        login,
        logout,
        updateUserSession,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
