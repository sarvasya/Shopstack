import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore the session from a saved token on first load.
  useEffect(() => {
    if (!localStorage.getItem('token')) return setReady(true);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const authenticate = async (mode, form) => {
    const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, ready, authenticate, logout }}>{children}</AuthCtx.Provider>;
}
