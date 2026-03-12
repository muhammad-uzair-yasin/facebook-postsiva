import { apiFetch } from "@/lib/apiClient";
import {
  getCachedValue,
  setCachedValue,
  clearCachedByPrefix,
} from "@/lib/cache";
import type {
  FacebookComment,
  FacebookCommentFlat,
  GetFacebookCommentsResponse,
  CommentActionResponse,
} from "./types";

const COMMENTS_BASE = (postId: string) =>
  `/facebook/posts/${encodeURIComponent(postId)}/comments`;
const COMMENT_REPLY = (postId: string) => COMMENTS_BASE(postId);
const COMMENT_HIDE = (postId: string) => `${COMMENTS_BASE(postId)}/hide`;
const COMMENT_UNHIDE = (postId: string) => `${COMMENTS_BASE(postId)}/unhide`;
const COMMENT_DELETE = (postId: string) => `${COMMENTS_BASE(postId)}`;

const COMMENTS_CACHE_PREFIX = "facebook_comments:";
const COMMENTS_TTL_MS = 1000 * 60 * 2; // 2 minutes

export type CommentSort =
  | "chronological"
  | "reverse_chronological"
  | "engagement";

export interface FetchFacebookCommentsParams {
  postId: string;
  pageId: string;
  limit?: number;
  after?: string;
  before?: string;
  sort?: CommentSort;
  search?: string;
  forceRefresh?: boolean;
}

export async function fetchFacebookComments(
  params: FetchFacebookCommentsParams,
): Promise<GetFacebookCommentsResponse> {
  const {
    postId,
    pageId,
    limit = 50,
    after,
    before,
    sort,
    search,
    forceRefresh,
  } = params;

  const cacheKey = `${COMMENTS_CACHE_PREFIX}${postId}:${pageId}:${limit}:${after || ""}:${before || ""}:${sort || ""}:${search || ""}`;

  if (!forceRefresh) {
    const cached = getCachedValue<GetFacebookCommentsResponse>(cacheKey);
    if (cached) return cached;
  }

  const qs = new URLSearchParams();
  // Backend expects page_id as a query param and the post id in the path
  qs.set("page_id", pageId);
  qs.set("limit", String(limit));
  if (after) qs.set("after", after);
  if (before) qs.set("before", before);
  if (sort) qs.set("sort", sort);
  if (search) qs.set("search", search);
  if (forceRefresh) qs.set("force_refresh", "true");

  const url = `${COMMENTS_BASE(postId)}?${qs.toString()}`;

  const data = await apiFetch<GetFacebookCommentsResponse>(
    url,
    { method: "GET" },
    { withAuth: true },
  );

  if (data?.success) {
    setCachedValue(cacheKey, data, COMMENTS_TTL_MS);
  }

  return data;
}

export async function replyToFacebookComment(params: {
  postId: string;
  pageId: string;
  commentId: string;
  message: string;
}): Promise<CommentActionResponse> {
  const { postId, pageId, commentId, message } = params;

  // Backend expects page_id as query param and body to contain message and comment_id
  const url = `${COMMENT_REPLY(postId)}?page_id=${encodeURIComponent(pageId)}`;
  const body = {
    message,
    comment_id: commentId,
  };

  const res = await apiFetch<CommentActionResponse>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { withAuth: true },
  );
  if (res?.success)
    clearCachedByPrefix(`${COMMENTS_CACHE_PREFIX}${postId}:${pageId}:`);
  return res;
}

export async function hideFacebookComment(params: {
  postId: string;
  pageId: string;
  commentId: string;
}): Promise<CommentActionResponse> {
  const { postId, pageId, commentId } = params;
  // Backend expects page_id as query param and body to contain comment_id
  const url = `${COMMENT_HIDE(postId)}?page_id=${encodeURIComponent(pageId)}`;
  const body = { comment_id: commentId };
  const res = await apiFetch<CommentActionResponse>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { withAuth: true },
  );
  if (res?.success)
    clearCachedByPrefix(`${COMMENTS_CACHE_PREFIX}${postId}:${pageId}:`);
  return res;
}

export async function unhideFacebookComment(params: {
  postId: string;
  pageId: string;
  commentId: string;
}): Promise<CommentActionResponse> {
  const { postId, pageId, commentId } = params;
  // Backend expects page_id as query param and body to contain comment_id
  const url = `${COMMENT_UNHIDE(postId)}?page_id=${encodeURIComponent(pageId)}`;
  const body = { comment_id: commentId };
  const res = await apiFetch<CommentActionResponse>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { withAuth: true },
  );
  if (res?.success)
    clearCachedByPrefix(`${COMMENTS_CACHE_PREFIX}${postId}:${pageId}:`);
  return res;
}

export async function deleteFacebookComment(params: {
  postId: string;
  pageId: string;
  commentId: string;
}): Promise<CommentActionResponse> {
  const { postId, pageId, commentId } = params;
  // Backend expects page_id as query param on delete route
  const url = `${COMMENT_DELETE(postId)}/${encodeURIComponent(commentId)}?page_id=${encodeURIComponent(pageId)}`;
  const res = await apiFetch<CommentActionResponse>(
    url,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
    { withAuth: true },
  );
  if (res?.success)
    clearCachedByPrefix(`${COMMENTS_CACHE_PREFIX}${postId}:${pageId}:`);
  return res;
}

/**
 * Normalize nested Facebook comments into a flat list for tree building.
 * Output aligns with CommentNode builder: parent_comment_id points to parent.
 */
export function normalizeFacebookCommentsToFlat(
  comments: FacebookComment[],
): FacebookCommentFlat[] {
  const flat: FacebookCommentFlat[] = [];

  function visit(nodes: FacebookComment[], parentId: string | null) {
    for (const c of nodes) {
      const id = c.id;
      if (!id) continue;

      // Facebook Graph may return nested comments as either an array `comments: []`
      // or an object `comments: { data: [...], paging: {...} }`.
      const childrenRaw = c.comments as any;
      const children: FacebookComment[] = Array.isArray(childrenRaw)
        ? childrenRaw
        : childrenRaw && Array.isArray(childrenRaw.data)
          ? childrenRaw.data
          : [];

      const replyCount =
        c.comment_count ?? (Array.isArray(children) ? children.length : 0);

      flat.push({
        comment_id: id,
        parent_comment_id: parentId,
        message: c.message ?? null,
        author_name: c.from?.name ?? null,
        created_at: c.created_time ?? null,
        like_count: c.like_count ?? 0,
        reply_count: replyCount,
        is_hidden: Boolean(c.is_hidden),
        has_children: Array.isArray(children) && children.length > 0,
      });

      if (children && children.length) {
        visit(children, id);
      }
    }
  }

  visit(comments, null);
  return flat;
}
