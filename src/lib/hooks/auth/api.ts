import { apiFetch, setAccessToken, setUserInfo, setRefreshToken } from '../../apiClient';
import { getCachedValue, setCachedValue } from '../../cache';
import { setWorkspacesCache } from '../../workspaceCache';
import { buildApiUrl } from '../../config';
import type { LoginPayload, LoginResponse, AuthUser } from './types';

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined' && window.location?.origin) {
    headers['X-Frontend-Origin'] = window.location.origin;
  }
  return headers;
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  setAccessToken(data.access_token);
  if (data.refresh_token) setRefreshToken(data.refresh_token);
  setUserInfo(data.user);
  if (data.workspaces?.length) setWorkspacesCache(data.workspaces);
  return data;
}

export async function signupRequest(payload: {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}): Promise<AuthUser> {
  const res = await fetch(buildApiUrl('/auth/signup'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { detail?: string }).detail ?? 'Signup failed';
    throw new Error(msg);
  }
  return (await res.json()) as AuthUser;
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  const res = await fetch(buildApiUrl('/auth/forgot-password'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { detail?: string }).detail ?? 'Request failed';
    throw new Error(msg);
  }
}

export async function resetPasswordRequest(token: string, newPassword: string): Promise<void> {
  const res = await fetch(buildApiUrl('/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { detail?: string }).detail ?? 'Reset failed';
    throw new Error(msg);
  }
}

export async function verifyEmailRequest(token: string): Promise<{ message: string }> {
  const res = await fetch(buildApiUrl(`/auth/verify-email?token=${encodeURIComponent(token)}`), {
    method: 'GET',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { detail?: string }).detail ?? 'Verification failed';
    throw new Error(msg);
  }
  return (await res.json()) as { message: string };
}

export async function resendVerificationEmailRequest(): Promise<void> {
  await apiFetch<unknown>(
    '/auth/resend-verification-email',
    { method: 'POST', headers: authHeaders() },
    { withAuth: true },
  );
}

export async function changePasswordRequest(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch<unknown>(
    '/auth/change-password',
    {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    },
    { withAuth: true },
  );
}

export async function refreshTokenRequest(refreshToken: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  setAccessToken(data.access_token);
  if (data.refresh_token) setRefreshToken(data.refresh_token);
  setUserInfo(data.user);
  return data;
}

export async function logoutRequest(refreshToken: string | null): Promise<void> {
  const url = buildApiUrl('/auth/logout');
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined,
  });
}

export const AUTH_USER_CACHE_KEY = 'auth_user:v1';
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

export async function fetchCurrentUser(options?: { forceRefresh?: boolean }): Promise<AuthUser> {
  if (!options?.forceRefresh) {
    const cached = getCachedValue<AuthUser>(AUTH_USER_CACHE_KEY);
    if (cached) return cached;
  }
  const data = await apiFetch<AuthUser>('/auth/me', { method: 'GET' }, { withAuth: true });
  setUserInfo(data);
  setCachedValue(AUTH_USER_CACHE_KEY, data, CACHE_TTL_MS);
  return data;
}

