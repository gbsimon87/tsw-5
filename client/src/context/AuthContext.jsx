import { useContext, createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          setUser({ ...response.data, token });
          setLoading(false);
        }).catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
      } catch (error) {
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (googleToken) => {
    try {
      const response = await axios.post('/auth/google', { token: googleToken });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser({ ...user, token });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};