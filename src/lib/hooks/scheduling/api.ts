import { apiFetch } from '../../apiClient';
import { clearCachedByPrefix, getCachedValue, setCachedValue } from '../../cache';
import type { ScheduledPostsResponse, GetScheduledPostsParams, ScheduledPost } from './types';

interface BackendScheduledPostsResponse {
  success: boolean;
  message: string;
  data?: {
    scheduled_posts?: ScheduledPost[];
    total?: number;
    platform?: string | null;
  };
  error?: string | null;
}

function buildListPath(params?: GetScheduledPostsParams): string {
  const queryParams = new URLSearchParams();
  queryParams.set('platform', params?.platform || 'facebook');
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.offset) {
    queryParams.append('offset', params.offset.toString());
  }
  const qs = queryParams.toString();
  return `/unified/scheduled-posts${qs ? `?${qs}` : ''}`;
}

export async function getScheduledPosts(
  params?: GetScheduledPostsParams
): Promise<ScheduledPostsResponse> {
  const cacheKey = `scheduled_posts:v1:${
    params?.platform || 'facebook'
  }:${params?.limit || 'default'}:${params?.offset || 0}`;

  if (!params?.forceRefresh) {
    const cached = getCachedValue<ScheduledPostsResponse>(cacheKey);
    if (cached) return cached;
  }

  const response = await apiFetch<BackendScheduledPostsResponse>(
    buildListPath(params),
    { method: 'GET' },
    { withAuth: true },
  );

  if (response.success && response.data) {
    const formatted: ScheduledPostsResponse = {
      user_id: '',
      scheduled_posts: response.data.scheduled_posts || [],
      total: response.data.total || 0,
      platform: response.data.platform || null,
    };
    setCachedValue(cacheKey, formatted, 2 * 60 * 1000);
    return formatted;
  }

  return {
    user_id: '',
    scheduled_posts: [],
    total: 0,
    platform: null,
  };
}

export interface UpdateScheduledPostRequest {
  scheduled_time?: string;
  post_data?: Record<string, unknown>;
  status?: string;
}

export async function updateScheduledPost(
  scheduledPostId: string,
  updateData: UpdateScheduledPostRequest
): Promise<ScheduledPostsResponse> {
  const response = await apiFetch<BackendScheduledPostsResponse>(
    `/unified/scheduled-posts/${scheduledPostId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    },
    { withAuth: true },
  );

  clearCachedByPrefix('scheduled_posts:v1');

  if (response.success && response.data) {
    return {
      user_id: '',
      scheduled_posts: response.data.scheduled_posts || [],
      total: response.data.total || 0,
      platform: response.data.platform || null,
    };
  }

  return {
    user_id: '',
    scheduled_posts: [],
    total: 0,
    platform: null,
  };
}

export async function deleteScheduledPost(
  scheduledPostId: string
): Promise<ScheduledPostsResponse> {
  const response = await apiFetch<BackendScheduledPostsResponse>(
    `/unified/scheduled-posts/${scheduledPostId}`,
    { method: 'DELETE' },
    { withAuth: true },
  );

  clearCachedByPrefix('scheduled_posts:v1');

  if (response.success && response.data) {
    return {
      user_id: '',
      scheduled_posts: response.data.scheduled_posts || [],
      total: response.data.total || 0,
      platform: response.data.platform || null,
    };
  }

  return {
    user_id: '',
    scheduled_posts: [],
    total: 0,
    platform: null,
  };
}
