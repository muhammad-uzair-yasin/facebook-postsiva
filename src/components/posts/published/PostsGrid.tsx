"use client";

import { motion, Variants } from "framer-motion";
import { PostCard } from "./PostCard";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";

interface PostWithPage extends FacebookPost {
  page_name?: string;
  page_id?: string;
}

interface PostsGridProps {
  posts: PostWithPage[];
  showPageName?: boolean;
  containerVariants?: Variants;
  itemVariants?: Variants;
  watcherPostIds?: Set<string>;
  onToggleAiWatcher?: (postId: string, pageId: string, enabled: boolean) => void;
  togglingWatcherId?: string | null;
}

export function PostsGrid({ 
  posts, 
  showPageName = false,
  containerVariants,
  itemVariants,
  watcherPostIds,
  onToggleAiWatcher,
  togglingWatcherId,
}: PostsGridProps) {
  console.log("PostsGrid received:", posts.length, "posts", posts);
  
  if (!posts || posts.length === 0) {
    console.warn("PostsGrid: No posts to render");
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post, index) => {
        console.log(`Rendering post ${index}:`, post.id, post.message?.substring(0, 50));
        return (
          <PostCard
            key={post.id}
            post={post}
            showPageName={showPageName}
            variants={itemVariants || undefined}
            aiWatcherEnabled={watcherPostIds?.has(post.id) ?? false}
            onToggleAiWatcher={onToggleAiWatcher}
            togglingWatcher={togglingWatcherId === post.id}
          />
        );
      })}
    </div>
  );
}
