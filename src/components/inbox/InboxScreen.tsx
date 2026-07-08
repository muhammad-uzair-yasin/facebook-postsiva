"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";
import { useFacebookPosts } from "@/lib/hooks/facebook/posts/useFacebookPosts";
import { useFacebookComments } from "@/lib/hooks/facebook/comments/useFacebookComments";
import { InboxLeftPanel } from "./InboxLeftPanel";
import { InboxCommentList } from "./InboxCommentList";
import { InboxPostPreview } from "./InboxPostPreview";

export default function InboxScreen() {
  const { selectedPage } = useSelectedPage();
  const pageId = selectedPage?.page_id ?? "";
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showPostPreview, setShowPostPreview] = useState(true);

  const {
    posts,
    loading: postsLoading,
    error: postsError,
  } = useFacebookPosts({ pageId: pageId || null, limit: 40 });

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  useEffect(() => {
    setSelectedPostId((prev) => {
      if (!prev) return null;
      return posts.some((p) => p.id === prev) ? prev : null;
    });
  }, [posts]);

  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    refresh: reloadComments,
  } = useFacebookComments({
    postId: selectedPostId,
    pageId: pageId || null,
    limit: 50,
  });

  return (
    <div className="flex h-[calc(100vh-5rem)] min-h-[28rem] flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-100 px-4 py-4 md:px-8">
        <h1 className="text-2xl font-black text-slate-900">Inbox</h1>
        <p className="text-sm text-slate-500">
          Comments for {selectedPage?.page_name ?? "your Facebook page"}
        </p>
      </div>

      {!pageId ? (
        <p className="p-8 text-sm text-amber-700">Select a Facebook page from the header.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {showLeftPanel ? (
            <InboxLeftPanel
              posts={posts}
              loading={postsLoading}
              error={postsError}
              selectedPostId={selectedPostId}
              onSelectPostId={setSelectedPostId}
              onClose={() => setShowLeftPanel(false)}
            />
          ) : null}
          <InboxCommentList
            pageId={pageId}
            post={selectedPost}
            comments={comments}
            loading={commentsLoading}
            error={commentsError}
            onReload={() => void reloadComments()}
            showLeftPanel={showLeftPanel}
            onToggleLeftPanel={() => setShowLeftPanel((v) => !v)}
            showPostPreview={showPostPreview}
            onTogglePostPreview={() => setShowPostPreview((v) => !v)}
          />
          {showPostPreview ? <InboxPostPreview post={selectedPost} /> : null}
        </div>
      )}
    </div>
  );
}
