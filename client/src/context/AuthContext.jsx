import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './auth-context.js';
import {
  refreshAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
} from '../lib/axiosInstance.js';
import { loginRequest, logoutRequest, verifyMfaRequest } from '../features/auth/api/auth.api.js';

// AuthProvider: holds the current user and exposes login/logout, silently restoring the session via the refresh cookie.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // Silent re-authentication on load using the httpOnly refresh cookie.
  useEffect(() => {
    refreshAccessToken()
      .then((data) => setUser(data.user))
      .catch(() => clearSession())
      .finally(() => setInitializing(false));
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    if (data.mfaRequired) return { mfaRequired: true, mfaToken: data.mfaToken };
    setAccessToken(data.accessToken);
    setUser(data.user);
    return { mfaRequired: false, user: data.user };
  }, []);

  const completeMfa = useCallback(async (payload) => {
    const data = await verifyMfaRequest(payload);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, setUser, initializing, login, completeMfa, logout, isAuthenticated: Boolean(user) }),
    [user, initializing, login, completeMfa, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
