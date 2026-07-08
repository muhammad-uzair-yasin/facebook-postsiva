"use client";

import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxLeftPanelProps {
  posts: FacebookPost[];
  loading: boolean;
  error: string | null;
  selectedPostId: string | null;
  onSelectPostId: (id: string) => void;
  onClose: () => void;
}

function previewText(post: FacebookPost): string {
  const t = (post.message || post.story || "").trim();
  if (!t) return "Media post";
  return t.length > 90 ? `${t.slice(0, 90)}…` : t;
}

export function InboxLeftPanel({
  posts,
  loading,
  error,
  selectedPostId,
  onSelectPostId,
  onClose,
}: InboxLeftPanelProps) {
  return (
    <div className="flex max-h-[min(44vh,22rem)] w-full shrink-0 flex-col overflow-hidden border-b border-slate-100 bg-white lg:max-h-none lg:h-auto lg:w-[min(22rem,100%)] lg:max-w-[340px] lg:border-b-0 lg:border-r lg:border-slate-100">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
          Posts
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          title="Hide posts"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {error ? <p className="p-4 text-center text-sm text-red-600">{error}</p> : null}
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : null}
        {!loading && !error && posts.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No published posts yet.</p>
        ) : null}
        <ul className="space-y-1 px-2">
          {posts.map((post) => {
            const active = post.id === selectedPostId;
            return (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onSelectPostId(post.id)}
                  className={cn(
                    "flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    active ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-slate-50",
                  )}
                >
                  {post.full_picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.full_picture}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium text-slate-800">
                      {previewText(post)}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {post.engagement?.comments_count ?? 0} comments
                      {post.created_time
                        ? ` · ${new Date(post.created_time).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
