"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchFacebookComments,
  replyToFacebookComment,
  hideFacebookComment,
  unhideFacebookComment,
  deleteFacebookComment,
  normalizeFacebookCommentsToFlat,
  type FetchFacebookCommentsParams,
  type CommentSort,
} from "./api";
import type { FacebookCommentFlat, GetFacebookCommentsResponse } from "./types";

export interface UseFacebookCommentsOptions {
  postId: string | null;
  pageId: string | null;
  limit?: number;
  sort?: CommentSort;
  search?: string;
}

export function useFacebookComments({
  postId,
  pageId,
  limit = 50,
  sort = "reverse_chronological",
  search,
}: UseFacebookCommentsOptions) {
  const [comments, setComments] = useState<FacebookCommentFlat[]>([]);
  const [paging, setPaging] = useState<GetFacebookCommentsResponse["paging"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [after, setAfter] = useState<string | undefined>(undefined);
  const [before, setBefore] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  const canQuery = Boolean(postId && pageId);

  const load = useCallback(
    async (opts?: { forceRefresh?: boolean; after?: string; before?: string }) => {
      if (!canQuery) return;
      setLoading(true);
      setError(null);
      try {
        const params: FetchFacebookCommentsParams = {
          postId: postId!,
          pageId: pageId!,
          limit,
          sort,
          search,
          after: opts?.after,
          before: opts?.before,
          forceRefresh: opts?.forceRefresh,
        };
        const res = await fetchFacebookComments(params);
        if (!res.success) {
          throw new Error(res.error || res.message || "Failed to load comments");
        }
        setPaging(res.paging ?? null);
        const raw = res.data ?? [];
        setComments(normalizeFacebookCommentsToFlat(raw));
      } catch (err: any) {
        setError(err?.message || "Failed to load comments");
      } finally {
        setLoading(false);
      }
    },
    [canQuery, postId, pageId, limit, sort, search],
  );

  const refresh = useCallback(async () => {
    if (!canQuery) return;
    setRefreshing(true);
    try {
      await load({ forceRefresh: true });
    } finally {
      setRefreshing(false);
    }
  }, [canQuery, load]);

  const goNext = useCallback(async () => {
    if (!paging?.cursors?.after) return;
    setAfter(paging.cursors.after);
    setBefore(undefined);
    await load({ after: paging.cursors.after });
  }, [paging?.cursors?.after, load]);

  const goPrevious = useCallback(async () => {
    if (!paging?.cursors?.before) return;
    setBefore(paging.cursors.before);
    setAfter(undefined);
    await load({ before: paging.cursors.before });
  }, [paging?.cursors?.before, load]);

  useEffect(() => {
    setAfter(undefined);
    setBefore(undefined);
    if (canQuery) {
      load();
    } else {
      setComments([]);
      setPaging(null);
    }
  }, [canQuery, postId, pageId, sort, search, limit, load]);

  const doReply = useCallback(
    async (commentId: string, message: string) => {
      if (!postId || !pageId) return { success: false, message: "Missing postId/pageId" };
      const res = await replyToFacebookComment({ postId, pageId, commentId, message });
      if (res.success) await refresh();
      return res;
    },
    [postId, pageId, refresh],
  );

  const doHide = useCallback(
    async (commentId: string) => {
      if (!postId || !pageId) return { success: false, message: "Missing postId/pageId" };
      const res = await hideFacebookComment({ postId, pageId, commentId });
      if (res.success) await refresh();
      return res;
    },
    [postId, pageId, refresh],
  );

  const doUnhide = useCallback(
    async (commentId: string) => {
      if (!postId || !pageId) return { success: false, message: "Missing postId/pageId" };
      const res = await unhideFacebookComment({ postId, pageId, commentId });
      if (res.success) await refresh();
      return res;
    },
    [postId, pageId, refresh],
  );

  const doDelete = useCallback(
    async (commentId: string) => {
      if (!postId || !pageId) return { success: false, message: "Missing postId/pageId" };
      const res = await deleteFacebookComment({ postId, pageId, commentId });
      if (res.success) await refresh();
      return res;
    },
    [postId, pageId, refresh],
  );

  const topLevel = useMemo(
    () => comments.filter((c) => !c.parent_comment_id),
    [comments],
  );

  const repliedCount = useMemo(
    () => topLevel.filter((c) => c.has_children || c.reply_count > 0).length,
    [topLevel],
  );

  const unrepliedCount = useMemo(
    () => topLevel.length - repliedCount,
    [topLevel.length, repliedCount],
  );

  return {
    comments,
    paging,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
    goNext,
    goPrevious,
    doReply,
    doHide,
    doUnhide,
    doDelete,
    metrics: {
      topLevelCount: topLevel.length,
      repliedCount,
      unrepliedCount,
    },
  };
}
