import { API_BASE_URL, STORAGE_KEYS, buildApiUrl } from './config';
import { setWorkspacesCache } from './workspaceCache';

// Re-export for backward compatibility
export { API_BASE_URL };

export const ACCESS_TOKEN_KEY = STORAGE_KEYS.ACCESS_TOKEN;
export const USER_INFO_KEY = STORAGE_KEYS.USER_INFO;
export const WORKSPACE_ID_KEY = 'postsiva_current_workspace_id';

// Request deduplication: prevent duplicate concurrent requests
const pendingRequests = new Map<string, Promise<unknown>>();

function getRequestKey(path: string, options: RequestInit, withAuth: boolean): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  const auth = withAuth ? getAccessToken() || '' : '';
  return `${method}:${path}:${body}:${auth}`;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setUserInfo(user: unknown | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_INFO_KEY);
  }
}

export function getUserInfo<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const AUTH_REFRESH_PATH = '/auth/refresh';

interface ApiFetchOptions {
  withAuth?: boolean;
  /** Internal: set when retrying after refresh to avoid retry loop */
  _internalRetried?: boolean;
}

async function doRefreshAndRetry<T>(
  path: string,
  options: RequestInit,
): Promise<T> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    setAccessToken(null);
    setRefreshToken(null);
    setUserInfo(null);
    throw new Error('Session expired. Please log in again.');
  }
  const refreshRes = await fetch(buildApiUrl(AUTH_REFRESH_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!refreshRes.ok) {
    setAccessToken(null);
    setRefreshToken(null);
    setUserInfo(null);
    const msg = (await refreshRes.json().catch(() => ({})) as { detail?: string })?.detail ?? 'Session expired. Please log in again.';
    throw new Error(msg);
  }
  const data = (await refreshRes.json()) as {
    access_token: string;
    refresh_token?: string;
    user?: unknown;
    workspaces?: unknown[];
  };
  setAccessToken(data.access_token);
  if (data.refresh_token) setRefreshToken(data.refresh_token);
  if (data.user) setUserInfo(data.user);
  if (Array.isArray(data.workspaces)) setWorkspacesCache(data.workspaces);
  return apiFetch<T>(path, options, { withAuth: true, _internalRetried: true });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  opts: ApiFetchOptions = {},
): Promise<T> {
  const { withAuth = false, _internalRetried = false } = opts;
  const isGetRequest = !options.method || options.method === 'GET';
  if (isGetRequest) {
    const requestKey = getRequestKey(path, options, withAuth);
    const pendingRequest = pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }
  }

  const url = buildApiUrl(path);
  const headers = new Headers(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData) {
    headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  }
  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (typeof window !== 'undefined') {
      const workspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
      if (workspaceId) headers.set('X-Workspace-Id', workspaceId);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000);

  const requestPromise = (async (): Promise<T> => {
    try {
      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.status === 401 && withAuth && !_internalRetried && path !== AUTH_REFRESH_PATH) {
        return doRefreshAndRetry<T>(path, options);
      }
      if (!res.ok) {
        let message = res.statusText;
        try {
          const data = await res.json();
          if (typeof data === 'string') message = data;
          else if (data && typeof data === 'object') {
            message = (data as { detail?: string; message?: string; error?: string }).detail
              ?? (data as { message?: string }).message
              ?? (data as { error?: string }).error
              ?? JSON.stringify(data);
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      if (res.status === 204) return undefined as unknown as T;
      return (await res.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 3 minutes');
      }
      throw error;
    } finally {
      if (isGetRequest) {
        const requestKey = getRequestKey(path, options, withAuth);
        pendingRequests.delete(requestKey);
      }
    }
  })();

  if (isGetRequest) {
    const requestKey = getRequestKey(path, options, withAuth);
    pendingRequests.set(requestKey, requestPromise);
  }
  return requestPromise;
}

