"use client";

import Image from "next/image";
import { memo } from "react";
import { 
  CheckCircle2, 
  MessageSquare, 
  Share2, 
  ExternalLink, 
  MoreVertical,
  Video,
  FileText,
  Calendar,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";

interface PostWithPage extends FacebookPost {
  page_name?: string;
  page_id?: string;
}

interface PostCardProps {
  post: PostWithPage;
  showPageName?: boolean;
  variants?: any;
  aiWatcherEnabled?: boolean;
  onToggleAiWatcher?: (postId: string, pageId: string, enabled: boolean) => void;
  togglingWatcher?: boolean;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Unknown date";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  } catch {
    return dateString;
  }
};

const formatNumber = (num: number | undefined): string => {
  if (!num) return "0";
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const getPostType = (post: PostWithPage): string => {
  if (post.type && post.type.trim() !== "") {
    return post.type.charAt(0).toUpperCase() + post.type.slice(1);
  }
  if (post.full_picture) {
    return "Photo";
  }
  if (post.message) {
    return "Text";
  }
  return "Post";
};

function PostCardComponent({
  post,
  showPageName = false,
  variants,
  aiWatcherEnabled = false,
  onToggleAiWatcher,
  togglingWatcher = false,
}: PostCardProps) {
  const engagement = post.engagement || {};
  const likes = engagement.likes_count ?? 0;
  const comments = engagement.comments_count ?? 0;
  const shares = engagement.shares_count ?? 0;
  const totalEngagement = likes + comments + shares;
  const postType = getPostType(post);
  const postMessage = post.message || post.story || "";
  const hasMessage = postMessage.trim().length > 0;
  const displayMessage = hasMessage 
    ? (postMessage.length > 200 ? postMessage.substring(0, 200) + "..." : postMessage)
    : null;
  
  const isVideo = post.permalink_url?.includes('/videos/') || post.permalink_url?.includes('/reel/') || post.type === 'video';

  return (
    <div 
      key={post.id} 
      className="h-full group hover:-translate-y-1 transition-transform duration-300"
    >
      <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col rounded-2xl bg-white cursor-pointer h-full hover:border-primary/30">
        {/* Image/Media Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {post.full_picture ? (
            <>
              <Image
                src={post.full_picture}
                alt={displayMessage || "Facebook post"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover-fill group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                unoptimized={post.full_picture?.includes('fbcdn.net')}
                priority={false}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
              {isVideo ? (
                <>
                  <Video className="w-16 h-16 text-primary/30 mb-2" />
                  <p className="text-xs font-bold text-primary/40 uppercase tracking-wider">Video Post</p>
                </>
              ) : (
                <>
                  <FileText className="w-16 h-16 text-primary/30 mb-2" />
                  <p className="text-xs font-bold text-primary/40 uppercase tracking-wider">Text Post</p>
                </>
              )}
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-[10px] font-black text-slate-700 shadow-md">
              {postType}
            </div>
            {showPageName && post.page_name && (
              <div className="px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-[10px] font-black text-white shadow-md max-w-[140px] truncate">
                {post.page_name}
              </div>
            )}
          </div>
          
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-black shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              Live
            </div>
          </div>
        </div>

        <CardContent className="p-6 flex-1 flex flex-col">
          {/* Post Message */}
          {displayMessage ? (
            <div className="mb-4">
              <p className="font-bold text-slate-900 line-clamp-5 group-hover:text-primary transition-colors text-sm leading-relaxed whitespace-pre-wrap">
                {displayMessage}
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-slate-400 italic text-sm">No text content</p>
            </div>
          )}

          {/* Date */}
          {post.created_time && (
            <div className="flex items-center gap-2 text-slate-500 mb-4">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold">{formatDate(post.created_time)}</span>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-black text-slate-900">{formatNumber(likes)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-black text-slate-900">{formatNumber(comments)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Comments</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-black text-slate-900">{formatNumber(shares)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Shares</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-black text-slate-900">{formatNumber(totalEngagement)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center justify-between pt-3 border-t border-slate-50 gap-2">
              <div className="flex flex-1 items-center gap-2">
                {post.permalink_url && (
                  <a
                    href={post.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-1 justify-center items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-primary hover:text-white rounded-lg text-slate-600 transition-all text-xs font-bold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </a>
                )}
              </div>
              {onToggleAiWatcher && post.page_id ? (
                <button
                  type="button"
                  disabled={togglingWatcher}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAiWatcher(post.id, post.page_id!, !aiWatcherEnabled);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    aiWatcherEnabled
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-50 text-slate-600 hover:bg-primary/5"
                  }`}
                >
                  {aiWatcherEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {aiWatcherEnabled ? "Watching" : "Watch"}
                </button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Memoize PostCard to prevent unnecessary re-renders
export const PostCard = memo(PostCardComponent);
