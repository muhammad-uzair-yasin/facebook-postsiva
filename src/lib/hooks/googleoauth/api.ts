import { setAccessToken, setUserInfo } from '../../apiClient';
import { buildGoogleOAuthLoginUrl, getFrontendCallbackUrl } from '../../config';
import type { GoogleAuthResponse } from './types';

/**
 * Build the Google login URL on the backend.
 * Frontend will redirect the browser to this URL.
 */
export function buildGoogleLoginUrl(): string {
  const redirectUri = getFrontendCallbackUrl();
  return buildGoogleOAuthLoginUrl(redirectUri);
}

/**
 * Handle Google callback query params on the frontend.
 * Expects backend to have redirected like:
 *   FRONTEND_URL + redirect_path?token=...&user=...&email=...&success=true
 *
 * After storing the access token, redirect to select-workspace.
 */
export async function handleGoogleCallbackFromSearch(search: string): Promise<{ response: GoogleAuthResponse; redirectPath: string } | null> {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(search);
  const token = params.get('token');
  const email = params.get('email');
  const username = params.get('user');
  const success = params.get('success');

  if (!token || success !== 'true' || !email || !username) {
    return null;
  }

  const user = {
    id: '',
    email,
    username,
    full_name: null,
    profile_picture: null,
  };

  setAccessToken(token);
  setUserInfo(user);

  const response: GoogleAuthResponse = {
    access_token: token,
    token_type: 'bearer',
    user,
  };

  return {
    response,
    redirectPath: '/select-workspace',
  };
}

