'use client';

import { useState, useCallback } from 'react';
import {
  uploadMedia,
  listMedia,
  deleteMedia,
  MediaItem,
} from './api';

interface UseMediaUploadState {
  media: MediaItem[];
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  page: number;
  pageSize: number;
  totalItems: number;
}

export function useMediaUpload() {
  const [state, setState] = useState<UseMediaUploadState>({
    media: [],
    isLoading: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
    page: 1,
    pageSize: 20,
    totalItems: 0,
  });

  // Upload a single file
  const upload = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

    try {
      const response = await uploadMedia({
        media: file,
        media_type: file.type.startsWith('video/') ? 'video' : 'image',
        platform: 'facebook',
        onProgress: (percent) => setState((prev) => ({ ...prev, uploadProgress: percent })),
      });

      setState((prev) => ({ ...prev, uploadProgress: 100, isUploading: false }));

      setTimeout(() => {
        setState((prev) => ({ ...prev, uploadProgress: 0 }));
      }, 1000);

      return response;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
      throw error;
    }
  }, []);

  // Upload multiple files
  const uploadMultiple = useCallback(async (files: File[]) => {
    setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0, error: null }));

    try {
      const response = await uploadMedia({
        images: files,
        media_type: 'images',
        platform: 'facebook',
        onProgress: (percent) => setState((prev) => ({ ...prev, uploadProgress: percent })),
      });
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
      }));

      setTimeout(() => {
        setState((prev) => ({ ...prev, uploadProgress: 0 }));
      }, 1000);

      return response;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
      throw error;
    }
  }, []);

  // Fetch media files
  const fetchMedia = useCallback(async (page = 1, pageSize = 20) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await listMedia({
        platform: 'facebook',
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setState((prev) => ({
        ...prev,
        isLoading: false,
        media: response.media || [],
        page,
        pageSize,
        totalItems: response.total || 0,
      }));
      return response;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch media',
      }));
      throw error;
    }
  }, []);

  // Filter media
  const filter = useCallback(
    async (params: {
      file_type?: string;
      platform?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await listMedia({
          media_type: params.file_type as 'image' | 'video' | undefined,
          platform: params.platform ?? 'facebook',
          limit: 100,
        });
        setState((prev) => ({
          ...prev,
          isLoading: false,
          media: response.media || [],
        }));
        return response;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Filter failed',
        }));
        throw error;
      }
    },
    []
  );

  // Delete single file
  const deleteFile = useCallback(async (mediaId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await deleteMedia(mediaId);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        media: prev.media.filter((m) => m.media_id !== mediaId),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }));
      throw error;
    }
  }, []);

  // Delete multiple files
  const deleteMultiple = useCallback(async (mediaIds: string[]) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Delete multiple files sequentially
      await Promise.all(mediaIds.map(id => deleteMedia(id)));
      setState((prev) => ({
        ...prev,
        isLoading: false,
        media: prev.media.filter((m) => !mediaIds.includes(m.media_id)),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Bulk delete failed',
      }));
      throw error;
    }
  }, []);

  // Cleanup unused media
  const cleanup = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Cleanup is not available in API, just refetch
      const response = await listMedia({
        platform: 'facebook',
        limit: state.pageSize,
        offset: 0,
      });
      setState((prev) => ({
        ...prev,
        isLoading: false,
        media: response.media || [],
        totalItems: response.total || 0,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      }));
      throw error;
    }
  }, [state.pageSize]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    upload,
    uploadMultiple,
    fetchMedia,
    filter,
    deleteFile,
    deleteMultiple,
    cleanup,
    clearError,
  };
}
