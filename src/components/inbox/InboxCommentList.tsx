"use client";

import { useCallback, useMemo, useState } from "react";
import type { FacebookCommentFlat } from "@/lib/hooks/facebook/comments/types";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";
import {
  generateFacebookCommentReplies,
  replyToFacebookComment,
  hideFacebookComment,
  unhideFacebookComment,
  deleteFacebookComment,
} from "@/lib/hooks/facebook/comments/api";
import { InboxCommentRow, type InboxCommentNode } from "./InboxCommentRow";
import { InboxSectionTabs, type InboxSection } from "./InboxSectionTabs";
import { InboxUnrepliedBulkBar } from "./InboxUnrepliedBulkBar";
import { Loader2, PanelLeft, PanelRight, RefreshCw } from "lucide-react";

function buildTree(flat: FacebookCommentFlat[]): InboxCommentNode[] {
  const byParent = new Map<string | null, FacebookCommentFlat[]>();
  for (const c of flat) {
    const pid = c.parent_comment_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  function build(pid: string | null): InboxCommentNode[] {
    return (byParent.get(pid) ?? []).map((comment) => ({
      comment,
      children: build(comment.comment_id),
    }));
  }
  return build(null);
}

interface InboxCommentListProps {
  pageId: string;
  post: FacebookPost | null;
  comments: FacebookCommentFlat[];
  loading: boolean;
  error: string | null;
  onReload: () => void;
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
  showPostPreview: boolean;
  onTogglePostPreview: () => void;
}

export function InboxCommentList({
  pageId,
  post,
  comments,
  loading,
  error,
  onReload,
  showLeftPanel,
  onToggleLeftPanel,
  showPostPreview,
  onTogglePostPreview,
}: InboxCommentListProps) {
  const [section, setSection] = useState<InboxSection>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openComposerId, setOpenComposerId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkPosting, setBulkPosting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(comments), [comments]);
  const roots = tree;

  const unrepliedRoots = useMemo(
    () => roots.filter((n) => !n.children.length && (n.comment.reply_count ?? 0) === 0),
    [roots],
  );
  const repliedRoots = useMemo(
    () => roots.filter((n) => n.children.length > 0 || (n.comment.reply_count ?? 0) > 0),
    [roots],
  );

  const visible = useMemo(() => {
    if (section === "unreplied") return unrepliedRoots;
    if (section === "replied") return repliedRoots;
    return roots;
  }, [section, roots, unrepliedRoots, repliedRoots]);

  const readyCount = useMemo(
    () => unrepliedRoots.filter((n) => (drafts[n.comment.comment_id] ?? "").trim()).length,
    [unrepliedRoots, drafts],
  );

  const onDraftChange = useCallback((id: string, text: string) => {
    setDrafts((prev) => ({ ...prev, [id]: text }));
  }, []);

  const onToggleComposer = useCallback((id: string) => {
    setOpenComposerId((prev) => (prev === id ? null : id));
  }, []);

  const handleGenerate = useCallback(
    async (commentId: string) => {
      if (!post) return;
      const comment = comments.find((c) => c.comment_id === commentId);
      if (!comment?.message?.trim()) return;
      setGeneratingId(commentId);
      setActionError(null);
      try {
        const res = await generateFacebookCommentReplies({
          pageId,
          postId: post.id,
          postContext: post.message ?? null,
          comments: [
            {
              comment_id: comment.comment_id,
              comment_text: comment.message,
              author_name: comment.author_name ?? undefined,
            },
          ],
        });
        const reply = res.generated_replies?.[0]?.generated_reply;
        if (reply) {
          setDrafts((prev) => ({ ...prev, [commentId]: reply }));
          setOpenComposerId(commentId);
        }
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : "Generate failed");
      } finally {
        setGeneratingId(null);
      }
    },
    [comments, pageId, post],
  );

  const handleSend = useCallback(
    async (commentId: string, text: string) => {
      if (!post) return;
      setSendingId(commentId);
      setActionError(null);
      try {
        await replyToFacebookComment({
          postId: post.id,
          pageId,
          commentId,
          message: text,
        });
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[commentId];
          return next;
        });
        setOpenComposerId(null);
        onReload();
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : "Reply failed");
      } finally {
        setSendingId(null);
      }
    },
    [pageId, post, onReload],
  );

  const handleGenerateAll = async () => {
    if (!post || unrepliedRoots.length === 0) return;
    setBulkGenerating(true);
    setActionError(null);
    try {
      const batch = unrepliedRoots.slice(0, 20).filter((n) => n.comment.message?.trim());
      const res = await generateFacebookCommentReplies({
        pageId,
        postId: post.id,
        postContext: post.message ?? null,
        comments: batch.map((n) => ({
          comment_id: n.comment.comment_id,
          comment_text: n.comment.message!,
          author_name: n.comment.author_name ?? undefined,
        })),
      });
      const next: Record<string, string> = {};
      for (const g of res.generated_replies ?? []) {
        if (g.comment_id && g.generated_reply) next[g.comment_id] = g.generated_reply;
      }
      setDrafts((prev) => ({ ...prev, ...next }));
      if (batch[0]) setOpenComposerId(batch[0].comment.comment_id);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Bulk generate failed");
    } finally {
      setBulkGenerating(false);
    }
  };

  const handlePostAll = async () => {
    if (!post) return;
    const ready = unrepliedRoots.filter((n) => (drafts[n.comment.comment_id] ?? "").trim());
    if (!ready.length) return;
    setBulkPosting(true);
    setActionError(null);
    try {
      for (const n of ready) {
        const text = drafts[n.comment.comment_id].trim();
        await replyToFacebookComment({
          postId: post.id,
          pageId,
          commentId: n.comment.comment_id,
          message: text,
        });
      }
      setDrafts({});
      onReload();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Bulk post failed");
      onReload();
    } finally {
      setBulkPosting(false);
    }
  };

  const runModeration = async (
    action: "hide" | "unhide" | "delete",
    commentId: string,
  ) => {
    if (!post) return;
    try {
      if (action === "hide") await hideFacebookComment({ postId: post.id, pageId, commentId });
      else if (action === "unhide")
        await unhideFacebookComment({ postId: post.id, pageId, commentId });
      else {
        if (!confirm("Delete this comment?")) return;
        await deleteFacebookComment({ postId: post.id, pageId, commentId });
      }
      onReload();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (!post) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
        <p className="text-sm font-medium text-slate-500">
          Select a post from the left panel to load comments.
        </p>
        {!showLeftPanel ? (
          <button
            type="button"
            onClick={onToggleLeftPanel}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            Show posts
          </button>
        ) : null}
      </div>
    );
  }

  const busy = bulkGenerating || bulkPosting;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onToggleLeftPanel}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
          title="Toggle posts"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">
            {(post.message || "Selected post").slice(0, 80)}
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onTogglePostPreview}
          className={`rounded-lg p-2 hover:bg-slate-50 ${showPostPreview ? "text-primary" : "text-slate-500"}`}
          title="Toggle preview"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>

      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <InboxSectionTabs
          section={section}
          onChange={setSection}
          allCount={roots.length}
          unrepliedCount={unrepliedRoots.length}
          repliedCount={repliedRoots.length}
        />
      </div>

      {section === "unreplied" ? (
        <InboxUnrepliedBulkBar
          targetCount={unrepliedRoots.length}
          readyCount={readyCount}
          busy={busy}
          generating={bulkGenerating}
          posting={bulkPosting}
          onGenerateAll={() => void handleGenerateAll()}
          onPostAll={() => void handlePostAll()}
        />
      ) : null}

      {(error || actionError) && (
        <p className="px-4 py-2 text-sm text-red-600">{actionError || error}</p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No comments in this filter.</p>
        ) : (
          <div className="space-y-5">
            {visible.map((node) => (
              <InboxCommentRow
                key={node.comment.comment_id}
                node={node}
                depth={0}
                drafts={drafts}
                onDraftChange={onDraftChange}
                openComposerId={openComposerId}
                onToggleComposer={onToggleComposer}
                onSend={handleSend}
                onGenerate={handleGenerate}
                onHide={(id) => void runModeration("hide", id)}
                onUnhide={(id) => void runModeration("unhide", id)}
                onDelete={(id) => void runModeration("delete", id)}
                generatingId={generatingId}
                sendingId={sendingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
