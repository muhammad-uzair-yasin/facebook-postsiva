import { apiFetch, getAccessToken, WORKSPACE_ID_KEY } from '../../apiClient';
import { buildApiUrl } from '../../config';
import { clearCachedByPrefix, getCachedValue, setCachedValue } from '../../cache';

const STORAGE_INIT_PATH = '/media/storage/init';
const STORAGE_CHUNK_PATH = '/media/storage/chunk';
const STORAGE_COMPLETE_PATH = '/media/storage/complete';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CHUNKED_THRESHOLD = 10 * 1024 * 1024; // 10MB
const PLATFORM = 'facebook';

/** Response from POST /media/storage/init */
export interface StorageInitResponse {
  upload_id: string;
  chunk_size: number;
}

/** Response from POST /media/storage/complete */
export interface StorageCompleteResponse {
  success: boolean;
  public_url: string;
  media_id: string;
  upload_id: string;
  filename: string;
  file_size: number;
}

export async function initChunkedUpload(
  filename: string,
  fileSize: number,
  totalChunks: number,
  platform: string,
  options?: { withAuth?: boolean; media_type?: 'image' | 'video' }
): Promise<StorageInitResponse> {
  const withAuth = options?.withAuth ?? true;
  const url = buildApiUrl(STORAGE_INIT_PATH);
  const token = withAuth ? getAccessToken() : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem(WORKSPACE_ID_KEY) : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (withAuth && workspaceId) (headers as Record<string, string>)['X-Workspace-Id'] = workspaceId;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filename,
      file_size: fileSize,
      total_chunks: totalChunks,
      platform,
      media_type: options?.media_type ?? 'video',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = (err as { detail?: string; message?: string }).detail ?? (err as { message?: string }).message ?? 'Init failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return res.json() as Promise<StorageInitResponse>;
}

export async function uploadChunk(
  uploadId: string,
  chunkNumber: number,
  chunkBlob: Blob,
  options?: { withAuth?: boolean }
): Promise<{ success: boolean }> {
  const withAuth = options?.withAuth ?? true;
  const url = buildApiUrl(STORAGE_CHUNK_PATH);
  const token = withAuth ? getAccessToken() : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem(WORKSPACE_ID_KEY) : null;
  const form = new FormData();
  form.append('upload_id', uploadId);
  form.append('chunk_number', String(chunkNumber));
  form.append('file', chunkBlob, 'chunk');
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (withAuth && workspaceId) (headers as Record<string, string>)['X-Workspace-Id'] = workspaceId;
  const res = await fetch(url, { method: 'POST', body: form, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = (err as { detail?: string; message?: string }).detail ?? (err as { message?: string }).message ?? 'Chunk upload failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return res.json() as Promise<{ success: boolean }>;
}

export async function completeChunkedUpload(
  uploadId: string,
  platform: string,
  options?: { withAuth?: boolean; media_type?: 'image' | 'video' }
): Promise<StorageCompleteResponse> {
  const withAuth = options?.withAuth ?? true;
  const url = buildApiUrl(STORAGE_COMPLETE_PATH);
  const token = withAuth ? getAccessToken() : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem(WORKSPACE_ID_KEY) : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (withAuth && workspaceId) (headers as Record<string, string>)['X-Workspace-Id'] = workspaceId;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      upload_id: uploadId,
      platform,
      media_type: options?.media_type ?? 'video',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const msg = (err as { detail?: string; message?: string }).detail ?? (err as { message?: string }).message ?? 'Complete failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return res.json() as Promise<StorageCompleteResponse>;
}

export interface MediaUploadResponse {
  success: boolean;
  message: string;
  media_id?: string;
  public_url?: string;
  filename?: string;
  file_size?: number;
  media_type?: string;
  platform?: string;
  error?: string;
}

export interface BulkMediaUploadResponse {
  success: boolean;
  message: string;
  uploaded_count: number;
  failed_count: number;
  media_ids: string[];
  results: Array<{
    success: boolean;
    media_id?: string;
    public_url?: string;
    filename?: string;
    error?: string;
  }>;
  errors?: string[];
}

export interface MediaItem {
  media_id: string;
  media_type: string;
  platform: string | null;
  public_url: string;
  filename: string;
  file_size: number;
  status: string;
  uploaded_at: string;
  expires_at: string | null;
}

export interface MediaListResponse {
  success: boolean;
  media: MediaItem[];
  total: number;
  limit: number;
  offset: number;
  count: number;
}

export interface UploadMediaParams {
  media?: File;
  media_url?: string;
  images?: File[];
  image_urls?: string;
  media_type: 'image' | 'video' | 'images';
  platform?: string;
  /** When provided, upload uses XHR and reports progress 0–100. */
  onProgress?: (percent: number) => void;
}

const LIST_CACHE_TTL_MS = 60 * 1000; // 1 minute
const listCacheKey = (params?: {
  media_type?: 'image' | 'video';
  platform?: string;
  limit?: number;
  offset?: number;
}) =>
  `media_list:v1:${params?.media_type || 'all'}:${params?.platform || 'all'}:${
    params?.limit || 'default'
  }:${params?.offset || 0}`;

export async function uploadMedia(params: UploadMediaParams): Promise<MediaUploadResponse | BulkMediaUploadResponse> {
  const file = params.media;
  const useChunked =
    params.media_type !== 'images' &&
    file &&
    (file as File).size >= CHUNKED_THRESHOLD;

  if (useChunked && file) {
    const f = file as File;
    const mediaType: 'image' | 'video' =
      params.media_type === 'image' || params.media_type === 'video'
        ? params.media_type
        : f.type.startsWith('video/')
          ? 'video'
          : 'image';
    const totalChunks = Math.ceil(f.size / CHUNK_SIZE);
    const { upload_id } = await initChunkedUpload(
      f.name,
      f.size,
      totalChunks,
      PLATFORM,
      { withAuth: true, media_type: mediaType }
    );
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, f.size);
      const chunkBlob = f.slice(start, end);
      await uploadChunk(upload_id, i + 1, chunkBlob, { withAuth: true });
      params.onProgress?.(Math.round(((i + 1) / totalChunks) * 100));
    }
    const completeResult = await completeChunkedUpload(upload_id, PLATFORM, {
      withAuth: true,
      media_type: mediaType,
    });
    const formData = new FormData();
    formData.append('media_url', completeResult.public_url);
    formData.append('platform', PLATFORM);
    formData.append('media_type', mediaType);
    const result = await apiFetch<MediaUploadResponse | BulkMediaUploadResponse>(
      '/media/upload',
      { method: 'POST', body: formData, headers: {} },
      { withAuth: true }
    );
    clearCachedByPrefix('media_list:v1');
    return result;
  }

  const formData = new FormData();
  
  if (params.media_type === 'images') {
    // Multiple images upload
    if (params.images && params.images.length > 0) {
      params.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    if (params.image_urls) {
      formData.append('image_urls', params.image_urls);
    }
    formData.append('media_type', 'images');
  } else {
    // Single image or video upload
    if (params.media) {
      formData.append('media', params.media);
    }
    if (params.media_url) {
      formData.append('media_url', params.media_url);
    }
    formData.append('media_type', params.media_type);
  }
  
  if (params.platform) {
    formData.append('platform', params.platform);
  }

  if (params.onProgress) {
    return new Promise<MediaUploadResponse | BulkMediaUploadResponse>((resolve, reject) => {
      const url = buildApiUrl('/media/upload');
      const xhr = new XMLHttpRequest();
      const token = getAccessToken();
      const workspaceId = typeof window !== 'undefined' ? localStorage.getItem(WORKSPACE_ID_KEY) : null;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          params.onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        clearCachedByPrefix('media_list:v1');
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText) as MediaUploadResponse | BulkMediaUploadResponse;
            resolve(result);
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          let message = xhr.statusText;
          try {
            const data = JSON.parse(xhr.responseText) as { detail?: string; message?: string };
            message = data.detail ?? data.message ?? message;
          } catch {
            /* ignore */
          }
          reject(new Error(message));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));

      xhr.open('POST', url);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      if (workspaceId) xhr.setRequestHeader('X-Workspace-Id', workspaceId);
      xhr.timeout = 180000;
      xhr.send(formData);
    });
  }

  const result = await apiFetch<MediaUploadResponse | BulkMediaUploadResponse>(
    '/media/upload',
    {
      method: 'POST',
      body: formData,
      headers: {},
    },
    { withAuth: true },
  );

  clearCachedByPrefix('media_list:v1');

  return result;
}

export async function listMedia(params?: {
  media_type?: 'image' | 'video';
  platform?: string;
  limit?: number;
  offset?: number;
  forceRefresh?: boolean;
}): Promise<MediaListResponse> {
  const cacheKey = listCacheKey(params);

  if (!params?.forceRefresh) {
    const cached = getCachedValue<MediaListResponse>(cacheKey);
    if (cached) return cached;
  }

  const queryParams = new URLSearchParams();
  
  if (params?.media_type) {
    queryParams.append('media_type', params.media_type);
  }
  if (params?.platform) {
    queryParams.append('platform', params.platform);
  }
  if (params?.limit) {
    queryParams.append('limit', String(params.limit));
  }
  if (params?.offset) {
    queryParams.append('offset', String(params.offset));
  }

  const query = queryParams.toString();
  const path = query ? `/media/?${query}` : '/media/';

  const result = await apiFetch<MediaListResponse>(
    path,
    {
      method: 'GET',
    },
    { withAuth: true },
  );

  setCachedValue(cacheKey, result, LIST_CACHE_TTL_MS);

  return result;
}

export async function getMedia(mediaId: string, options?: { forceRefresh?: boolean }): Promise<MediaUploadResponse> {
  const cacheKey = `media_get:v1:${mediaId}`;
  
  if (!options?.forceRefresh) {
    const cached = getCachedValue<MediaUploadResponse>(cacheKey);
    if (cached) return cached;
  }

  const result = await apiFetch<MediaUploadResponse>(
    `/media/${mediaId}`,
    {
      method: 'GET',
    },
    { withAuth: true },
  );

  // Cache for 1 hour - media metadata doesn't change frequently
  setCachedValue(cacheKey, result, 60 * 60 * 1000);

  return result;
}

export async function deleteMedia(mediaId: string): Promise<{ success: boolean; message: string }> {
  const result = await apiFetch<{ success: boolean; message: string }>(
    `/media/${mediaId}`,
    {
      method: 'DELETE',
    },
    { withAuth: true },
  );

  clearCachedByPrefix('media_list:v1');

  return result;
}
