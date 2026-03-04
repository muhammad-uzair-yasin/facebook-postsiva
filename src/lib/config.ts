/**
 * Application Configuration
 * 
 * Centralized configuration for all API URLs and endpoints.
 * Change URLs here or via environment variables.
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_BASE_URL: Base URL for the backend API (default: https://backend.postsiva.com)
 * - NEXT_PUBLIC_API_URL: Alternative env var name (falls back to NEXT_PUBLIC_API_BASE_URL)
 * - NEXT_PUBLIC_FRONTEND_URL: Frontend URL for OAuth callbacks (default: http://localhost:3000)
 */

// Base API URL - can be overridden via environment variables.
// IMPORTANT: NEXT_PUBLIC_* vars are baked in at build time. After changing .env,
// restart the dev server and clear the cache: rm -rf .next && npm run dev
const getApiBaseUrl = (): string => {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';
  const url = (typeof raw === 'string' ? raw : '').trim().replace(/^["']|["']$/g, '');
  return url || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

/** WhatsApp business number that users message to for posting (can override via env) */
export const WHATSAPP_BUSINESS_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "+923157349862";

/**
 * API Endpoints
 * All API endpoints are relative to API_BASE_URL unless they start with http:// or https://
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification-email',
    CHANGE_PASSWORD: '/auth/change-password',
    PROFILE: '/auth/profile',
    GOOGLE_LOGIN: '/auth/google/login',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },

  // OAuth
  OAUTH: {
    FACEBOOK_CREATE_TOKEN: '/facebook/create-token',
    TOKENS: '/oauth/tokens',
  },

  // Facebook
  FACEBOOK: {
    GET_TOKEN: '/facebook/get-token',
    PAGES: '/facebook/pages',
    POSTS: '/facebook/posts',
    USER_PROFILE: '/facebook/user-profile',
    TEXT_POST: '/facebook/text-post',
    PERSONA: {
      BUILD: '/facebook/persona/build',
      GET: '/facebook/persona',
      UPDATE: '/facebook/persona',
      PATCH: '/facebook/persona',
      DELETE: '/facebook/persona',
      REGENERATE: '/facebook/persona',
    },
    AI_AGENT_PERSONA: {
      BUILD: '/facebook/ai-agent-persona/build',
      GET: '/facebook/ai-agent-persona',
      UPDATE: '/facebook/ai-agent-persona',
      PATCH: '/facebook/ai-agent-persona',
      DELETE: '/facebook/ai-agent-persona',
      REGENERATE: '/facebook/ai-agent-persona',
    },
  },

  // Media (unified API: list GET /media?platform=...&media_type=...&limit=...&offset=..., get GET /media/{id}, delete DELETE /media/{id})
  MEDIA: {
    UPLOAD: '/media/upload',
    LIST: '/media',
    GET: '/media',
    DELETE: '/media',
  },

  // Dashboard
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    VIDEOS: '/dashboard/videos',
  },

  // Tier System
  TIER: {
    GET_TIERS: '/tiers',
    USAGE: '/usage',
    ORDERS: '/orders',
  },
} as const;

/**
 * Helper function to build full URL from endpoint
 * @param endpoint - API endpoint (relative or absolute)
 * @returns Full URL
 */
export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

/**
 * Helper function to build Google OAuth login URL with redirect URI
 * @param redirectUri - The redirect path after OAuth (e.g., /auth/google/callback)
 * @param origin - Optional frontend origin URL (defaults to localhost:3000)
 * @returns Full Google OAuth login URL
 */
export function buildGoogleOAuthLoginUrl(redirectUri: string, origin?: string): string {
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const url = new URL(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`);
  url.searchParams.set('redirect_uri', redirectUri);

  // Add origin parameter so backend knows where to redirect after OAuth
  if (origin) {
    url.searchParams.set('origin', origin);
  } else if (typeof window !== 'undefined') {
    // Use current window origin if available
    url.searchParams.set('origin', window.location.origin);
  } else {
    // Default to localhost for server-side
    url.searchParams.set('origin', 'http://localhost:3000');
  }

  return url.toString();
}

/**
 * Helper function to build Google OAuth callback URL
 * @param code - Authorization code from Google
 * @param state - Optional state parameter
 * @returns Full Google OAuth callback URL
 */
export function buildGoogleOAuthCallbackUrl(code: string, state?: string): string {
  const params = new URLSearchParams({ code });
  if (state) {
    params.append('state', state);
  }
  return `${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_CALLBACK}?${params.toString()}`;
}

/**
 * Frontend URLs (for redirects)
 */
export const FRONTEND_URLS = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/profile',
  FACEBOOK_CONNECT: '/facebook-connect',
  GOOGLE_CALLBACK: '/auth/google/callback',
} as const;

/**
 * Helper function to get frontend callback URL
 * Returns the path only (not full URL) for backend redirect_uri parameter
 * The backend will use this path to redirect after OAuth completes
 * @returns Frontend callback path (e.g., /auth/google/callback)
 */
export function getFrontendCallbackUrl(): string {
  // Return just the path - backend will prepend the frontend origin
  return FRONTEND_URLS.GOOGLE_CALLBACK;
}

/**
 * Helper function to get full frontend callback URL
 * Used when we need the complete URL (e.g., for display or logging)
 * @returns Full frontend callback URL
 */
export function getFullFrontendCallbackUrl(): string {
  const frontendUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    // 'http://localhost:8000';
    'https://facebook-autoamtion-website-sigma.vercel.app';

  // Ensure it's a full URL with protocol
  const url = frontendUrl.startsWith('http')
    ? frontendUrl
    : `http://${frontendUrl}`;

  return `${url}${FRONTEND_URLS.GOOGLE_CALLBACK}`;
}

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'postsiva_access_token',
  REFRESH_TOKEN: 'postsiva_refresh_token',
  USER_INFO: 'postsiva_user',
} as const;
