import { apiFetch } from '../../apiClient';
import { clearCachedByPrefix, setCachedValue, getCachedValue } from '../../cache';
import { fetchFacebookUserProfile } from '../facebook/userProfile/api';
import type { FacebookPagesResponse } from './types';

const LONG_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

interface CreateTokenResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    user_id: string;
    auth_url: string;
    instructions: string;
  };
}

export async function createFacebookAuthUrl(): Promise<string> {
  const data = await apiFetch<CreateTokenResponse>(
    '/facebook/create-token',
    {
      method: 'POST',
    },
    { withAuth: true },
  );

  if (!data.success || !data.data?.auth_url) {
    throw new Error(data.message || 'Failed to create Facebook auth URL');
  }

  return data.data.auth_url;
}

export async function fetchFacebookPages(options?: { forceRefresh?: boolean }): Promise<FacebookPagesResponse> {
  const cacheKey = 'facebook_pages:v1';

  if (!options?.forceRefresh) {
    const cached = getCachedValue<FacebookPagesResponse>(cacheKey);
    if (cached) return cached;
  }

  const profileRes = await fetchFacebookUserProfile(true, { forceRefresh: true });
  const pagesRaw = profileRes?.pages ?? [];
  const pagesArray = Array.isArray(pagesRaw) ? pagesRaw : pagesRaw ? [pagesRaw] : [];

  const pages: FacebookPagesResponse['pages'] = pagesArray
    .map((p: { page_id?: string; id?: string; page_name?: string; name?: string }) => ({
      page_id: String(p.page_id ?? p.id ?? ''),
      page_name: p.page_name ?? p.name ?? undefined,
    }))
    .filter((p) => p.page_id);

  const normalizedResponse: FacebookPagesResponse = {
    success: profileRes?.success !== false,
    message: profileRes?.message || '',
    pages,
    count: pages.length,
    user_id: profileRes?.profile?.facebook_user_id,
  };

  setCachedValue(cacheKey, normalizedResponse, LONG_CACHE_TTL_MS);
  return normalizedResponse;
}

export async function disconnectFacebook(): Promise<void> {
  await apiFetch(
    '/facebook/delete-token',
    {
      method: 'DELETE',
    },
    { withAuth: true },
  );

  // Clear all Facebook-related caches
  clearCachedByPrefix('facebook_pages:v1');
  clearCachedByPrefix('facebook_token:v1');
  clearCachedByPrefix('facebook_user_profile:v1');
}

