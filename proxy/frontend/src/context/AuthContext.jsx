import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('proxy_token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('proxy_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      localStorage.setItem('proxy_token', token);
    } else {
      localStorage.removeItem('proxy_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('proxy_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('proxy_user');
    }
  }, [user]);

  async function signIn(username, password) {
    setLoading(true);
    setError('');
    try {
      const result = await loginRequest(username, password);
      setToken(result.token);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setToken('');
    setUser(null);
    setError('');
  }

  const value = useMemo(() => ({ token, user, loading, error, signIn, signOut }), [token, user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
