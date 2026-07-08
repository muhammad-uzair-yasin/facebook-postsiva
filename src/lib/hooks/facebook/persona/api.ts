import { apiFetch } from '../../../apiClient';
import { clearCachedValue, getCachedValue, setCachedValue } from '../../../cache';
import { buildApiUrl, API_ENDPOINTS } from '../../../config';
import type {
  PersonaResponse,
  PersonaUpdateRequest,
  PersonaPatchRequest,
  PersonaRegenerateRequest,
} from './types';

// Long-lived cache; use forceRefresh to pull fresh after edits
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year
const cacheKey = (pageId: string) => `persona:v2:${pageId}`;

function cachePersonaResponse(pageId: string, data: PersonaResponse) {
  if (data.success && data.data) {
    setCachedValue(cacheKey(pageId), data, CACHE_TTL_MS);
  }
}

export async function buildPersona(
  pageId: string,
  postsLimit: number = 30,
): Promise<PersonaResponse> {
  const url = buildApiUrl(API_ENDPOINTS.FACEBOOK.PERSONA.BUILD);
  const queryParams = new URLSearchParams({
    page_id: pageId,
    posts_limit: postsLimit.toString(),
  });
  
  const data = await apiFetch<PersonaResponse>(
    `${url}?${queryParams.toString()}`,
    {
      method: 'POST',
    },
    { withAuth: true },
  );

  clearCachedValue(cacheKey(pageId));
  cachePersonaResponse(pageId, data);

  return data;
}

export async function getPersona(
  pageId: string,
  forceRefresh: boolean = false,
): Promise<PersonaResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FACEBOOK.PERSONA.GET}/${pageId}`);
  const queryParams = new URLSearchParams({
    force_refresh: forceRefresh.toString(),
  });

  if (!forceRefresh) {
    const cached = getCachedValue<PersonaResponse>(cacheKey(pageId));
    if (cached) return cached;
  }
  
  const data = await apiFetch<PersonaResponse>(
    `${url}?${queryParams.toString()}`,
    {
      method: 'GET',
    },
    { withAuth: true },
  );

  // Only cache successful hits — never cache "not found" or errors
  if (data.success && data.data) {
    setCachedValue(cacheKey(pageId), data, CACHE_TTL_MS);
  } else if (forceRefresh) {
    clearCachedValue(cacheKey(pageId));
  }

  return data;
}

export async function updatePersona(
  pageId: string,
  request: PersonaUpdateRequest,
): Promise<PersonaResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FACEBOOK.PERSONA.UPDATE}/${pageId}`);
  
  const data = await apiFetch<PersonaResponse>(
    url,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    },
    { withAuth: true },
  );

  clearCachedValue(cacheKey(pageId));
  cachePersonaResponse(pageId, data);

  return data;
}

export async function patchPersona(
  pageId: string,
  request: PersonaPatchRequest,
): Promise<PersonaResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FACEBOOK.PERSONA.PATCH}/${pageId}`);
  
  const data = await apiFetch<PersonaResponse>(
    url,
    {
      method: 'PATCH',
      body: JSON.stringify(request),
    },
    { withAuth: true },
  );

  clearCachedValue(cacheKey(pageId));
  cachePersonaResponse(pageId, data);

  return data;
}

export async function deletePersona(
  pageId: string,
): Promise<PersonaResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FACEBOOK.PERSONA.DELETE}/${pageId}`);
  
  const data = await apiFetch<PersonaResponse>(
    url,
    {
      method: 'DELETE',
    },
    { withAuth: true },
  );

  clearCachedValue(cacheKey(pageId));

  return data;
}

export async function regeneratePersona(
  pageId: string,
  request: PersonaRegenerateRequest,
  postsLimit: number = 30,
): Promise<PersonaResponse> {
  const url = buildApiUrl(`${API_ENDPOINTS.FACEBOOK.PERSONA.REGENERATE}/${pageId}/regenerate`);
  const queryParams = new URLSearchParams({
    posts_limit: postsLimit.toString(),
  });
  
  const data = await apiFetch<PersonaResponse>(
    `${url}?${queryParams.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    { withAuth: true },
  );

  clearCachedValue(cacheKey(pageId));
  cachePersonaResponse(pageId, data);

  return data;
}
