"use client";

import type { FacebookCommentFlat } from "@/lib/hooks/facebook/comments/types";
import { Loader2, Reply, Sparkles, Eye, EyeOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InboxCommentNode {
  comment: FacebookCommentFlat;
  children: InboxCommentNode[];
}

interface InboxCommentRowProps {
  node: InboxCommentNode;
  depth: number;
  drafts: Record<string, string>;
  onDraftChange: (commentId: string, text: string) => void;
  openComposerId: string | null;
  onToggleComposer: (commentId: string) => void;
  onSend: (commentId: string, text: string) => Promise<void>;
  onGenerate: (commentId: string) => Promise<void>;
  onHide: (commentId: string) => void;
  onUnhide: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  generatingId: string | null;
  sendingId: string | null;
}

export function InboxCommentRow(props: InboxCommentRowProps) {
  const {
    node,
    depth,
    drafts,
    onDraftChange,
    openComposerId,
    onToggleComposer,
    onSend,
    onGenerate,
    onHide,
    onUnhide,
    onDelete,
    generatingId,
    sendingId,
  } = props;
  const c = node.comment;
  const name = c.author_name ?? "Commenter";
  const open = openComposerId === c.comment_id;
  const draft = drafts[c.comment_id] ?? "";
  const isGen = generatingId === c.comment_id;
  const isSend = sendingId === c.comment_id;
  const indent = depth > 0;

  return (
    <div className={cn(indent && "ml-8 border-l border-slate-100 pl-4")}>
      <div className="flex gap-3">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-500",
            indent ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
          )}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-slate-100",
              !indent && "rounded-tl-md",
            )}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={cn("font-bold text-slate-900", indent ? "text-xs" : "text-sm")}>
                {name}
              </span>
              <span className="text-[10px] text-slate-400">
                {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
              </span>
              {c.is_hidden ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Hidden
                </span>
              ) : null}
            </div>
            <p
              className={cn(
                "whitespace-pre-wrap leading-relaxed text-slate-700",
                indent ? "text-xs" : "text-sm",
              )}
            >
              {c.message ?? "(no text)"}
            </p>
          </div>

          {depth === 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onToggleComposer(c.comment_id)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/10"
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
              <button
                type="button"
                disabled={isGen}
                onClick={() => void onGenerate(c.comment_id)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
              >
                {isGen ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Generate reply
              </button>
              {c.is_hidden ? (
                <button
                  type="button"
                  onClick={() => onUnhide(c.comment_id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                >
                  <Eye className="h-3.5 w-3.5" /> Unhide
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onHide(c.comment_id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                >
                  <EyeOff className="h-3.5 w-3.5" /> Hide
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(c.comment_id)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <span className="ml-auto self-center text-[10px] text-slate-400">
                {c.reply_count} replies · {c.like_count} likes
              </span>
            </div>
          ) : null}

          {open ? (
            <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-100">
              <textarea
                value={draft}
                onChange={(e) => onDraftChange(c.comment_id, e.target.value)}
                rows={3}
                placeholder="Write a reply…"
                className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onToggleComposer(c.comment_id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!draft.trim() || isSend}
                  onClick={() => void onSend(c.comment_id, draft.trim())}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  {isSend ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Reply className="h-3.5 w-3.5" />
                  )}
                  Send
                </button>
              </div>
            </div>
          ) : null}

          {node.children.length > 0 ? (
            <div className="mt-3 space-y-3">
              {node.children.map((child) => (
                <InboxCommentRow
                  key={child.comment.comment_id}
                  {...props}
                  node={child}
                  depth={depth + 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
