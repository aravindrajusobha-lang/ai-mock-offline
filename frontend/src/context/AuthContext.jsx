import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, login as loginRequest, register as registerRequest } from '../api/auth.js';
import {
  ApiError,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '../api/client.js';

const AuthContext = createContext(null);

function getUserFromResponse(response) {
  const user = response?.user
    ?? response?.data?.user
    ?? response?.data
    ?? (response?.role || response?.email || response?.id !== undefined ? response : null);
  if (!user || typeof user !== 'object' || Array.isArray(user)) {
    throw new ApiError('The TalkReady server did not return a user profile.', {
      code: 'INVALID_AUTH_RESPONSE',
      details: response,
    });
  }
  return user;
}

function getTokenFromResponse(response) {
  const token = response?.token ?? response?.accessToken;
  if (typeof token !== 'string' || token.length === 0) {
    throw new ApiError('The TalkReady server did not return an authentication token.', {
      code: 'INVALID_AUTH_RESPONSE',
      details: response,
    });
  }
  return token;
}

function isUnauthorized(error) {
  return error instanceof ApiError && [401, 403].includes(error.status);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [restoreError, setRestoreError] = useState(null);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      setRestoreError(null);
      setStatus('unauthenticated');
      return null;
    }

    setStatus('loading');
    setRestoreError(null);
    try {
      const response = await getCurrentUser();
      const currentUser = getUserFromResponse(response);
      setUser(currentUser);
      setStatus('authenticated');
      return currentUser;
    } catch (error) {
      if (isUnauthorized(error)) {
        clearAuthToken();
        setUser(null);
        setStatus('unauthenticated');
      } else {
        setRestoreError(error);
        setStatus('error');
      }
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const authenticate = useCallback(async (request, details) => {
    const response = await request(details);
    const token = getTokenFromResponse(response);
    setAuthToken(token);
    try {
      const responseUser = response.user ?? response.data?.user;
      const authenticatedUser = responseUser
        ? getUserFromResponse(response)
        : getUserFromResponse(await getCurrentUser());
      setUser(authenticatedUser);
      setRestoreError(null);
      setStatus('authenticated');
      return authenticatedUser;
    } catch (error) {
      clearAuthToken();
      setUser(null);
      setStatus('unauthenticated');
      throw error;
    }
  }, []);

  const login = useCallback(
    (credentials) => authenticate(loginRequest, credentials),
    [authenticate],
  );
  const register = useCallback(
    (details) => authenticate(registerRequest, details),
    [authenticate],
  );

  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
    setRestoreError(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ user, status, restoreError, login, register, logout, refreshUser }),
    [user, status, restoreError, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
