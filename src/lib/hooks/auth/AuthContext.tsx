'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { clearCachedValue, setCachedValue } from '../../cache';
import { getRefreshToken } from '../../apiClient';
import { clearSessionData } from '../../auth-helpers';
import { useRouter } from 'next/navigation';
import { loginRequest, fetchCurrentUser, logoutRequest, AUTH_USER_CACHE_KEY, CACHE_TTL_MS } from './api';
import { fetchFacebookToken } from '../facebook/token/api';
import type { AuthUser, LoginPayload } from './types';
import { STORAGE_KEYS } from '../../config';
import { getUserUsage } from '../tier/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  hasFacebookToken: boolean;
  facebookTokenChecked: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkFacebookToken: (forceRefresh?: boolean) => Promise<boolean>;
  /** Set token status from workspace (e.g. login response) to skip GET /facebook/get-token. */
  setFacebookTokenFromWorkspace: (connected: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFacebookToken, setHasFacebookToken] = useState(false);
  const [facebookTokenChecked, setFacebookTokenChecked] = useState(false);

  // Hydrate session from localStorage on mount (runs once). Token status is set when WorkspaceContext sets currentWorkspace (from workspace.facebook_connected or get-token when workspace selected), like Instagram.
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

        if (!accessToken) {
          setIsHydrated(true);
          return;
        }

        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch (err) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        setUser(null);
      } finally {
        setIsHydrated(true);
        setIsLoading(false);
      }
    };

    initializeSession();
  }, []); // Run only once on mount

  const checkFacebookTokenStatus = useCallback(async (forceRefresh?: boolean): Promise<boolean> => {
    try {
      const res = await fetchFacebookToken({ forceRefresh });
      const hasFbToken = res.success === true && res.data && Object.keys(res.data).length > 0;
      setHasFacebookToken(hasFbToken);
      setFacebookTokenChecked(true);
      return hasFbToken;
    } catch {
      setHasFacebookToken(false);
      setFacebookTokenChecked(true);
      return false;
    }
  }, []);

  const setFacebookTokenFromWorkspace = useCallback((connected: boolean) => {
    setHasFacebookToken(connected);
    setFacebookTokenChecked(true);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loginRequest(payload);
      setUser(data.user);
      setCachedValue(AUTH_USER_CACHE_KEY, data.user, CACHE_TTL_MS);

      // Silently check subscription status
      try {
        const usageResponse = await getUserUsage('facebook');
        if (usageResponse.success && usageResponse.usage) {
          const usage = usageResponse.usage;
          const isPaid = usage.current_tier_name !== 'free';
          const subscriptionInfo = {
            platform: 'facebook',
            tier_name: usage.current_tier_name,
            is_paid: isPaid,
            is_unlimited: usage.is_unlimited,
            credits_expire_at: usage.credits_expire_at,
            is_expired: usage.is_expired,
            usage,
          };
          localStorage.setItem('postsiva_subscription', JSON.stringify(subscriptionInfo));
        }
      } catch (err) {
        console.debug('Subscription check failed:', err);
      }

      router.push('/select-workspace');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setUser(null);
    setHasFacebookToken(false);
    setFacebookTokenChecked(false);
    setError(null);
    const refreshToken = getRefreshToken();
    try {
      await logoutRequest(refreshToken);
    } catch {
      // ignore so user still gets logged out locally
    }
    clearSessionData();
    router.push('/login');
  }, [router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isHydrated,
    error,
    hasFacebookToken,
    facebookTokenChecked,
    login,
    logout,
    checkFacebookToken: checkFacebookTokenStatus,
    setFacebookTokenFromWorkspace,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
