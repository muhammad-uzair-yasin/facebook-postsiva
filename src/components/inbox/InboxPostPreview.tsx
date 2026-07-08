"use client";

import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";
import { ExternalLink, MessageCircle, ThumbsUp, Share2 } from "lucide-react";

interface InboxPostPreviewProps {
  post: FacebookPost | null;
}

export function InboxPostPreview({ post }: InboxPostPreviewProps) {
  if (!post) {
    return (
      <aside className="hidden w-full shrink-0 border-t border-slate-100 bg-slate-50/50 p-6 lg:block lg:w-72 lg:border-t-0 lg:border-l">
        <p className="text-sm text-slate-500">Select a post to preview.</p>
      </aside>
    );
  }

  const likes = post.engagement?.likes_count ?? 0;
  const comments = post.engagement?.comments_count ?? 0;
  const shares = post.engagement?.shares_count ?? 0;

  return (
    <aside className="w-full shrink-0 border-t border-slate-100 bg-white p-4 lg:w-72 lg:border-t-0 lg:border-l lg:border-slate-100">
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
        Post preview
      </p>
      {post.full_picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.full_picture}
          alt=""
          className="mb-3 w-full rounded-xl object-cover"
        />
      ) : null}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
        {(post.message || post.story || "No caption").trim()}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" /> {likes}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> {comments}
        </span>
        <span className="inline-flex items-center gap-1">
          <Share2 className="h-3.5 w-3.5" /> {shares}
        </span>
      </div>
      {post.permalink_url ? (
        <a
          href={post.permalink_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View on Facebook
        </a>
      ) : null}
    </aside>
  );
}
