"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCw,
  MessageSquare,
  FileText,
  Loader2,
  Reply,
  EyeOff,
  Eye,
  Trash2,
  Search,
  SortAsc,
  SortDesc,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";
import { useFacebookPosts } from "@/lib/hooks/facebook/posts/useFacebookPosts";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";
import { useFacebookComments } from "@/lib/hooks/facebook/comments/useFacebookComments";
import type { FacebookCommentFlat } from "@/lib/hooks/facebook/comments/types";

type CommentFilter = "all" | "replied" | "unreplied";
type CommentSortUi = "recent" | "oldest" | "engagement";

function buildCommentTree(flat: FacebookCommentFlat[]) {
  const byParent = new Map<string | null, FacebookCommentFlat[]>();
  for (const c of flat) {
    const pid = c.parent_comment_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  function build(
    pid: string | null,
  ): { comment: FacebookCommentFlat; children: any[] }[] {
    const list = byParent.get(pid) ?? [];
    return list.map((comment) => ({
      comment,
      children: build(comment.comment_id),
    }));
  }
  return build(null);
}

function CommentCard({
  node,
  onReply,
  onHide,
  onUnhide,
  onDelete,
  isNested,
}: {
  node: { comment: FacebookCommentFlat; children: any[] };
  onReply: (commentId: string) => void;
  onHide: (commentId: string) => void;
  onUnhide: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  isNested: boolean;
}) {
  const c = node.comment;
  const name = c.author_name ?? "Commenter";
  const created = c.created_at ? new Date(c.created_at).toLocaleString() : "";
  return (
    <div className={cn("flex gap-3", isNested && "ml-6 mt-3")}>
      <div
        className={cn(
          "rounded-full shrink-0 flex items-center justify-center border border-[var(--border)] bg-[var(--muted)]",
          isNested ? "w-8 h-8" : "w-10 h-10",
        )}
      >
        <span
          className={cn(
            "font-semibold text-[var(--muted-foreground)]",
            isNested ? "text-xs" : "text-sm",
          )}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={cn(
              "font-semibold text-[var(--foreground)]",
              isNested ? "text-xs" : "text-sm",
            )}
          >
            {name}
          </span>
          <span
            className={cn(
              "text-[var(--muted-foreground)]",
              isNested ? "text-[10px]" : "text-xs",
            )}
          >
            {created}
          </span>
          {c.is_hidden && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              Hidden
            </span>
          )}
        </div>
        <p
          className={cn(
            "text-[var(--foreground)] whitespace-pre-wrap leading-relaxed",
            isNested ? "text-xs" : "text-sm",
          )}
        >
          {c.message ?? "(no text)"}
        </p>
        {!isNested && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)]">
            <button
              onClick={() => onReply(c.comment_id)}
              className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-primary/40 hover:text-primary flex items-center gap-1 transition-all"
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
            {c.is_hidden ? (
              <button
                onClick={() => onUnhide(c.comment_id)}
                className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-emerald-400/40 hover:text-emerald-700 flex items-center gap-1 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> Unhide
              </button>
            ) : (
              <button
                onClick={() => onHide(c.comment_id)}
                className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-amber-400/40 hover:text-amber-700 flex items-center gap-1 transition-all"
                title="Hide comment"
              >
                <EyeOff className="w-3.5 h-3.5" /> Hide
              </button>
            )}
            <button
              onClick={() => onDelete(c.comment_id)}
              className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:border-red-400/40 hover:text-red-600 flex items-center gap-1 transition-all"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
              {c.reply_count} replies · {c.like_count} likes
            </span>
          </div>
        )}
        {node.children.length > 0 && (
          <div className="mt-4 space-y-3">
            {node.children.map((child: any) => (
              <CommentCard
                key={child.comment.comment_id}
                node={child}
                onReply={onReply}
                onHide={onHide}
                onUnhide={onUnhide}
                onDelete={onDelete}
                isNested
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyBox({
  onSend,
  onCancel,
  sending,
}: {
  onSend: (text: string) => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-3 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Write a reply..."
        className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!text.trim() || sending}
          onClick={() => onSend(text.trim())}
          className={cn(
            "px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 font-semibold",
            !text.trim() || sending
              ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
              : "bg-primary text-white hover:opacity-90",
          )}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Reply className="w-3.5 h-3.5" />
          )}{" "}
          Reply
        </button>
      </div>
    </div>
  );
}

export default function FacebookCommentsPage() {
  const { selectedPage } = useSelectedPage();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    reload: reloadPosts,
  } = useFacebookPosts({ pageId: selectedPage?.page_id ?? null, limit: 20 });

  const [filter, setFilter] = useState<CommentFilter>("all");
  const [sortUi, setSortUi] = useState<CommentSortUi>("recent");
  const [search, setSearch] = useState("");
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [replySending, setReplySending] = useState(false);
  const [confirm, setConfirm] = useState<{
    action: "hide" | "delete" | null;
    commentId: string | null;
  }>({ action: null, commentId: null });

  const sortParam = useMemo(() => {
    if (sortUi === "oldest") return "chronological" as const;
    if (sortUi === "engagement") return "engagement" as const;
    return "reverse_chronological" as const;
  }, [sortUi]);

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    refresh: refreshComments,
    doReply,
    doHide,
    doUnhide,
    doDelete,
    metrics,
    paging,
    goNext,
    goPrevious,
  } = useFacebookComments({
    postId: selectedPostId,
    pageId: selectedPage?.page_id ?? null,
    limit: 50,
    sort: sortParam,
    search: search.trim() || undefined,
  });

  useEffect(() => {
    if (!selectedPostId && posts.length > 0 && posts[0].id) {
      setSelectedPostId(posts[0].id);
    }
  }, [posts, selectedPostId]);

  const filteredComments = useMemo(() => {
    if (filter === "all") return comments;
    const top = comments.filter((c) => !c.parent_comment_id);
    if (filter === "replied") {
      const repliedIds = new Set(
        top
          .filter((c) => c.has_children || c.reply_count > 0)
          .map((c) => c.comment_id),
      );
      const include = new Set<string>(repliedIds);
      // include descendants
      let changed = true;
      while (changed) {
        changed = false;
        for (const c of comments) {
          if (
            c.parent_comment_id &&
            include.has(c.parent_comment_id) &&
            !include.has(c.comment_id)
          ) {
            include.add(c.comment_id);
            changed = true;
          }
        }
      }
      return comments.filter((c) => include.has(c.comment_id));
    }
    // unreplied
    const unrepliedIds = new Set(
      top
        .filter((c) => !(c.has_children || c.reply_count > 0))
        .map((c) => c.comment_id),
    );
    return comments.filter((c) => unrepliedIds.has(c.comment_id));
  }, [comments, filter]);

  const tree = useMemo(
    () => buildCommentTree(filteredComments),
    [filteredComments],
  );

  const handleReplySend = async (commentId: string, text: string) => {
    setReplySending(true);
    try {
      await doReply(commentId, text);
      setActiveReplyFor(null);
    } finally {
      setReplySending(false);
    }
  };

  const confirmAction = async () => {
    if (!confirm.action || !confirm.commentId) return;
    const id = confirm.commentId;
    try {
      if (confirm.action === "hide") {
        await doHide(id);
      } else if (confirm.action === "delete") {
        await doDelete(id);
      }
    } finally {
      setConfirm({ action: null, commentId: null });
    }
  };

  const cancelConfirm = () => setConfirm({ action: null, commentId: null });

  function ConfirmModal({
    open,
    onConfirm,
    onCancel,
    action,
  }: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    action: "hide" | "delete" | null;
  }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-[420px]">
          <h3 className="font-semibold text-lg mb-2">Confirm {action}</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Are you sure you want to {action} this comment? This action can be
            undone for hide but not for delete.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 rounded-lg bg-[var(--muted)]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1 rounded-lg bg-red-600 text-white"
            >
              {action === "delete" ? "Delete" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f4f7fb] flex flex-col">
      <div className="flex-1 flex min-h-0">
        <aside className="w-[340px] shrink-0 min-h-0 border-r border-[#e5e7eb] bg-white/50 flex flex-col z-10">
          <div className="p-5 border-b border-[#e5e7eb] bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div>
              <h2 className="font-semibold text-[#0f172a]">Your Posts</h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Select a post to view comments
              </p>
            </div>
            <button
              type="button"
              onClick={() => reloadPosts({ forceRefresh: true })}
              className="p-2 rounded-lg bg-[#f1f5f9] text-[#64748b] hover:text-[#0f172a] transition-colors"
              title="Refresh posts"
            >
              <RefreshCw
                className={cn("w-4 h-4", postsLoading && "animate-spin")}
              />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-full rounded-2xl bg-[#f1f5f9] animate-pulse"
                  />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#94a3b8]" />
                </div>
                <p className="text-[#64748b] text-sm">No posts found.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {posts.map((post) => {
                  const id = post.id;
                  if (!id) return null;
                  const selected = selectedPostId === id;
                  const caption = post.message ?? post.story ?? "";
                  const snippet =
                    caption.length > 90
                      ? `${caption.slice(0, 90)}…`
                      : caption || "No text";
                  const thumb = post.full_picture ?? undefined;
                  const commentCount = post.engagement?.comments_count ?? 0;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPostId(id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl border transition-all duration-200",
                          selected
                            ? "bg-white border-[#2563eb] shadow-md ring-1 ring-[#2563eb]/20"
                            : "bg-white border-[#e5e7eb] shadow-sm hover:border-[#2563eb]/30 hover:shadow-md",
                        )}
                      >
                        <div className="flex gap-3.5">
                          {thumb ? (
                            <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#f8fafc]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumb}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] shrink-0 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#94a3b8]" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1.5">
                              {post.created_time
                                ? new Date(
                                    post.created_time,
                                  ).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : ""}
                            </span>
                            <p className="text-sm font-semibold text-[#0f172a] line-clamp-2">
                              {snippet}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#64748b]">
                              <MessageSquare className="w-3.5 h-3.5" />{" "}
                              {commentCount} comments
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
        <main className="flex-1 min-h-0 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold">Comments</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Moderate comments for your selected post
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-full border px-3 py-1">
                <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search comments"
                  className="bg-transparent text-sm outline-none w-64"
                />
              </div>
              <div className="bg-white rounded-full border px-3 py-1 text-sm flex items-center gap-2">
                <button
                  onClick={() => setSortUi("recent")}
                  className={cn(sortUi === "recent" && "font-semibold")}
                >
                  <SortDesc className="w-4 h-4" /> Recent
                </button>
                <button
                  onClick={() => setSortUi("oldest")}
                  className={cn(sortUi === "oldest" && "font-semibold")}
                >
                  <SortAsc className="w-4 h-4" /> Oldest
                </button>
                <button
                  onClick={() => setSortUi("engagement")}
                  className={cn(sortUi === "engagement" && "font-semibold")}
                >
                  <ShieldCheck className="w-4 h-4" /> Engagement
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[var(--muted-foreground)]">
                  Showing {metrics.topLevelCount} top-level comments
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <button
                    onClick={() => refreshComments()}
                    className="px-2 py-1 bg-[var(--muted)] rounded-lg"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={() => reloadPosts({ forceRefresh: true })}
                    className="px-2 py-1 bg-[var(--muted)] rounded-lg"
                  >
                    Refresh posts
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 rounded-lg bg-[#f1f5f9] animate-pulse"
                      />
                    ))}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-[var(--muted-foreground)] py-10">
                    No comments found.
                  </div>
                ) : (
                  tree.map((node) => (
                    <div
                      key={node.comment.comment_id}
                      className="p-3 rounded-lg border bg-[var(--card)]"
                    >
                      <CommentCard
                        node={node}
                        onReply={(id) => setActiveReplyFor(id)}
                        onHide={(id) => {
                          setConfirm({ action: "hide", commentId: id });
                        }}
                        onUnhide={(id) => doUnhide(id)}
                        onDelete={(id) => {
                          setConfirm({ action: "delete", commentId: id });
                        }}
                        isNested={false}
                      />
                      +{" "}
                      <ConfirmModal
                        open={Boolean(confirm.action)}
                        onConfirm={confirmAction}
                        onCancel={cancelConfirm}
                        action={confirm.action}
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-[var(--muted-foreground)]">
                  {paging?.cursors?.before ? (
                    <button
                      onClick={() => goPrevious()}
                      className="px-3 py-1 rounded-lg bg-[var(--muted)]"
                    >
                      Previous
                    </button>
                  ) : null}
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {paging?.cursors?.after ? (
                    <button
                      onClick={() => goNext()}
                      className="px-3 py-1 rounded-lg bg-[var(--muted)]"
                    >
                      Next
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {activeReplyFor && (
              <div className="rounded-xl border bg-white p-4">
                <ReplyBox
                  onSend={(text) => handleReplySend(activeReplyFor, text)}
                  onCancel={() => setActiveReplyFor(null)}
                  sending={replySending}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
