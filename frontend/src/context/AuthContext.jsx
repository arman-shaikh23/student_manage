import { createContext, useState, useEffect } from 'react';
import api, { setToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Try silent refresh via cookie
      try {
        const res = await api.get('/auth/refresh');
        if (res.data.success) {
          setToken(res.data.accessToken);
          setUser({ id: res.data.id, role: res.data.role, email: res.data.email });
        }
      } catch (error) {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, role) => {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data.success) {
        setToken(res.data.data.accessToken);
        setUser({ id: res.data.data.id, email: res.data.data.email, role: res.data.data.role });
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, admin: user?.role === 'ADMIN' ? user : null, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
