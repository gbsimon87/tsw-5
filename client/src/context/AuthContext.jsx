import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { debounce } from 'lodash';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Base URL for API requests
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      const response = await axios.post(`${apiBaseUrl}/auth/refresh`, { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      const decoded = jwtDecode(token);
      const userResponse = await axios.get(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (typeof userResponse.data !== 'object' || !userResponse.data.email) {
        throw new Error('Invalid user data received from /auth/me');
      }
      setUser({ ...userResponse.data, token, _id: decoded.userId });
      return token;
    } catch (error) {
      console.error('Refresh token error:', error.message, error.response?.data);
      const { error: message, code } = error.response?.data || {};
      window.gtag('event', 'failed_token_refresh', { reason: code || 'unknown' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw new Error(message || 'Token refresh failed');
    }
  };

  // Initial token validation and user fetch
  useEffect(() => {
    const validateToken = async () => {
      let token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const response = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (typeof response.data !== 'object' || !response.data.email) {
          throw new Error('Invalid user data received from /auth/me');
        }
        setUser({ ...response.data, token, _id: decoded.userId });
        setLoading(false);
      } catch (error) {
        console.error('Token validation error:', error.message, error.response?.data);
        if (error.response?.status === 401) {
          try {
            token = await refreshToken();
            setLoading(false);
          } catch (refreshError) {
            console.error('Token validation failed after refresh:', refreshError.message);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setLoading(false);
          }
        } else {
          const { error: message, code } = error.response?.data || {};
          window.gtag('event', 'failed_auth_me', { reason: code || 'unknown' });
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setUser(null);
          setLoading(false);
        }
      }
    };

    validateToken();
  }, []);

  // Auto-refresh token every 12 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (localStorage.getItem('token')) {
        try {
          await refreshToken();
        } catch (err) {
          console.error('Auto-refresh failed:', err.message);
        }
      }
    }, 12 * 60 * 1000); // 12 minutes
    return () => clearInterval(interval);
  }, []);

  // Debounced login function to prevent duplicate requests
  const login = debounce(async (credentials, isGoogle = false) => {
    console.log(isGoogle)
    try {
      let response;
      if (isGoogle) {
        response = await axios.post(`${apiBaseUrl}/auth/google`, { token: credentials });
      } else {
        if (!credentials.email || !credentials.password) {
          throw new Error('Email and password are required');
        }
        console.log('apiBaseUrl:', apiBaseUrl);
        // response = await axios.post(`${apiBaseUrl}/auth/login`, credentials);
        response = await axios.post(`/auth/login`, credentials);
      }
      const { token: jwtToken, refreshToken, user: userData } = response.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('refreshToken', refreshToken);
      const decoded = jwtDecode(jwtToken);
      setUser({ ...userData, token: jwtToken, _id: decoded.userId });
    } catch (error) {
      const { error: message, code } = error.response?.data || {};
      const eventName = isGoogle ? 'failed_google_auth' : 'failed_login';
      window.gtag('event', eventName, { reason: code || 'unknown' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw new Error(message || 'Authentication failed');
    }
  }, 500); // 500ms debounce

  const register = async (credentials) => {
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/register`, credentials);
      const { token: jwtToken, refreshToken, user: userData } = response.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('refreshToken', refreshToken);
      const decoded = jwtDecode(jwtToken);
      setUser({ ...userData, token: jwtToken, _id: decoded.userId });
    } catch (error) {
      console.error('Register error:', error.message, error.response?.data);
      const { error: message, code } = error.response?.data || {};
      window.gtag('event', 'failed_registration', { reason: code || 'unknown' });
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw new Error(message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};