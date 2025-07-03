import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(response => {
          setUser({ ...response.data, token, _id: decoded.userId });
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

  const login = async (token, isGoogle = false) => {
    try {
      if (isGoogle) {
        const response = await axios.post('/auth/google', { token });
        const { token: jwtToken, user } = response.data;
        localStorage.setItem('token', jwtToken);
        const decoded = jwtDecode(jwtToken);
        setUser({ ...user, token: jwtToken, _id: decoded.userId });
      } else {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        const response = await axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser({ ...response.data, token, _id: decoded.userId });
      }
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};