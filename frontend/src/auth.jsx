import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('tb_user') || 'null');
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const persist = useCallback((payload) => {
    localStorage.setItem('tb_token', payload.access);
    localStorage.setItem('tb_user', JSON.stringify(payload.user));
    setUser(payload.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tb_token');
    localStorage.removeItem('tb_user');
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('tb-logout', logout);
    return () => window.removeEventListener('tb-logout', logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login/', { email, password });
        persist(data);
        return data.user;
      },
      register: async (form) => {
        const { data } = await api.post('/auth/register/', form);
        persist(data);
        return data.user;
      },
      updateProfile: async (patch) => {
        const { data } = await api.patch('/auth/me/', patch);
        localStorage.setItem('tb_user', JSON.stringify(data));
        setUser(data);
        return data;
      },
      logout,
    }),
    [user, persist, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/** Wrap a page that needs a signed-in user (optionally of a specific role). */
export function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
