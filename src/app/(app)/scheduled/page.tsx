"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Copy, 
  Video, 
  Check, 
  Globe, 
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send as SendIcon,
  Sparkles,
  Database,
  Upload,
  Type,
  MoreHorizontal,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import dynamic from 'next/dynamic';

// Lazy load Calendar component - it's heavy
const Calendar = dynamic(() => import('react-calendar'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-50 rounded-xl animate-pulse" />,
});
import { useScheduledPosts } from "@/lib/hooks/scheduling/useScheduledPosts";
import { getMedia, uploadMedia, listMedia, type MediaItem } from "@/lib/hooks/media/api";
import { updateScheduledPost, deleteScheduledPost } from "@/lib/hooks/scheduling/api";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";
import { createFacebookImagePost } from "@/lib/hooks/facebook/imagePost/api";
import { createFacebookCarouselPost } from "@/lib/hooks/facebook/carouselPost/api";
import { createFacebookVideoPost } from "@/lib/hooks/facebook/videoPost/api";
import { createFacebookImageStory, createFacebookVideoStory } from "@/lib/hooks/facebook/storyPost/api";
import { useFacebookTextPost } from "@/lib/hooks/facebook/textPost/useFacebookTextPost";
import type { ScheduledPost } from "@/lib/hooks/scheduling/types";

type PostType = "text" | "image" | "carousel" | "video" | "story_image" | "story_video";
type Visibility = "public" | "connections";

export default function ScheduledPage() {
  const [showModal, setShowModal] = useState(false);
  const [postType, setPostType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>(undefined);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]); // For carousel
  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]); // For carousel preview
  const { selectedPage } = useSelectedPage();
  const selectedPageId = selectedPage?.page_id || "";
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageMedia, setStorageMedia] = useState<MediaItem[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [postingSuccess, setPostingSuccess] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use scheduling hook
  const {
    scheduledPosts,
    loading: loadingScheduledPosts,
    error: scheduledPostsError,
    total,
    loadScheduledPosts,
  } = useScheduledPosts();

  // Use text post hook
  const { publishTextPost, loading: textPostLoading } = useFacebookTextPost();

  // Track if we've loaded once to prevent double-mount in dev mode
  const hasLoadedRef = useRef(false);

  // Load scheduled posts on mount and when platform filter changes - filter only Facebook
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadScheduledPosts({ platform: 'facebook' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postTypes = [
    { id: "text", title: "Text", sub: "Post text only", icon: Type },
    { id: "image", title: "Photo", sub: "Post a photo", icon: ImageIcon },
    { id: "video", title: "Video", sub: "Post a video", icon: Video },
    { id: "carousel", title: "Carousel", sub: "Post 2-10 images", icon: Copy },
    { id: "story_image", title: "Story (Image)", sub: "Create an image story", icon: Sparkles },
    { id: "story_video", title: "Story (Video)", sub: "Create a video story", icon: Sparkles },
  ];

  // Load storage media when modal opens
  useEffect(() => {
    if (showStorageModal) {
      const loadStorageMedia = async () => {
        try {
          setLoadingStorage(true);
          
          let mediaTypeFilter: 'image' | 'video' | undefined = undefined;
          if (postType === 'image') {
            mediaTypeFilter = 'image';
          } else if (postType === 'video') {
            mediaTypeFilter = 'video';
          }
          
          const response = await listMedia({
            platform: 'facebook',
            media_type: mediaTypeFilter,
            limit: 100,
          });
          
          if (response.success) {
            setStorageMedia(response.media);
          }
        } catch (err) {
          console.error("Failed to load storage media:", err);
        } finally {
          setLoadingStorage(false);
        }
      };
      
      loadStorageMedia();
    }
  }, [showStorageModal, postType]);

  const handleSelectFromStorage = (media: MediaItem) => {
    if (postType === 'carousel') {
      const isSelected = selectedMediaIds.includes(media.media_id);
      if (isSelected) {
        setSelectedMediaIds(prev => prev.filter(id => id !== media.media_id));
        setSelectedMediaItems(prev => prev.filter(item => item.media_id !== media.media_id));
        setPreviewUrls(prev => {
          const itemIndex = selectedMediaItems.findIndex(item => item.media_id === media.media_id);
          return prev.filter((_, index) => index !== itemIndex);
        });
      } else {
        setSelectedMediaIds(prev => [...prev, media.media_id]);
        setSelectedMediaItems(prev => [...prev, media]);
        setPreviewUrls(prev => [...prev, media.public_url]);
      }
      return;
    }
    
    setSelectedMediaId(media.media_id);
    setPreviewUrls([media.public_url]);
    setSelectedMediaIds([]);
    setSelectedMediaItems([]);
    
    const currentType = postType;
    const mediaType = media.media_type;
    
    if (currentType === 'text') {
      if (mediaType === 'image') {
        setPostType('image');
      } else if (mediaType === 'video') {
        setPostType('video');
      }
    } else if (currentType === 'story_image' && mediaType === 'video') {
      setPostType('story_video');
    } else if (currentType === 'story_video' && mediaType === 'image') {
      setPostType('story_image');
    } else if (currentType === 'image' && mediaType !== 'image') {
      setPostType('video');
    } else if (currentType === 'video' && mediaType !== 'video') {
      setPostType('image');
    }
    
    setShowStorageModal(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newUrls = files.map(file => URL.createObjectURL(file));
      
      if (postType === "carousel") {
        setPreviewUrls(prev => [...prev, ...newUrls].slice(0, 20));
      } else {
        setPreviewUrls(newUrls.slice(0, 1));
        
        if (files.length > 0) {
          try {
            const file = files[0];
            const isVideo = file.type.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'image';
            
            setLoadingMedia(true);
            setUploadProgress(0);
            const result = await uploadMedia({
              media: file,
              media_type: mediaType,
              platform: 'facebook',
              onProgress: setUploadProgress,
            });
            setUploadProgress(100);
            if (result.success && 'media_id' in result && result.media_id) {
              setSelectedMediaId(result.media_id);
              if (isVideo && postType !== 'video') {
                setPostType('video');
              } else if (!isVideo && postType !== 'image') {
                setPostType('image');
              }
            }
          } catch (err) {
            console.error("Failed to upload media:", err);
          } finally {
            setLoadingMedia(false);
            setUploadProgress(0);
          }
        }
      }
    }
  };

  const removeFile = (index: number) => {
    if (postType === "carousel") {
      const itemToRemove = selectedMediaItems[index];
      if (itemToRemove) {
        setSelectedMediaIds(prev => prev.filter(id => id !== itemToRemove.media_id));
        setSelectedMediaItems(prev => prev.filter((_, idx) => idx !== index));
        setPreviewUrls(prev => prev.filter((_, idx) => idx !== index));
      }
    } else {
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      setSelectedMediaId(null);
    }
  };

  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setPostType(post.post_type as PostType);
    setContent(post.post_data?.message || "");
    setScheduledDate(new Date(post.scheduled_time));
    
    // Set media if available
    if (post.media?.media_urls && post.media.media_urls.length > 0) {
      if (post.post_type === "carousel") {
        setSelectedMediaIds(post.media.media_urls.map(m => m.media_id));
        setSelectedMediaItems(post.media.media_urls.map(m => ({
          media_id: m.media_id,
          media_type: m.media_type,
          platform: m.platform,
          public_url: m.public_url,
          filename: m.filename,
          file_size: m.file_size,
          status: "uploaded",
          uploaded_at: new Date().toISOString(),
          expires_at: null,
        })));
        setPreviewUrls(post.media.media_urls.map(m => m.public_url));
      } else {
        setSelectedMediaId(post.media.media_urls[0].media_id);
        setPreviewUrls([post.media.media_urls[0].public_url]);
      }
    }
    
    setShowModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) {
      return;
    }

    try {
      setDeletingPostId(postId);
      await deleteScheduledPost(postId);
      await loadScheduledPosts({ platform: 'facebook' });
    } catch (err: any) {
      console.error("Failed to delete scheduled post:", err);
      alert(err.message || "Failed to delete scheduled post. Please try again.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;
    if (!selectedPageId) {
      alert("Please select a Facebook page");
      return;
    }

    // Validate scheduled time is in the future
    if (scheduledDate <= new Date()) {
      alert("Please select a future date and time");
      return;
    }

    // Format scheduled time as ISO string with timezone
    const scheduledTime = scheduledDate.toISOString();

    try {
      setScheduling(true);
      
      // Prepare update data
      const updateData: any = {
        scheduled_time: scheduledTime,
      };

      // Update post_data based on post type
      if (postType === "text") {
        updateData.post_data = {
          message: content.trim(),
        };
      } else if (postType === "image" && selectedMediaId) {
        updateData.post_data = {
          message: content.trim() || undefined,
          media_id: selectedMediaId,
        };
      } else if (postType === "video" && selectedMediaId) {
        updateData.post_data = {
          description: content.trim() || undefined,
          media_id: selectedMediaId,
        };
      } else if (postType === "carousel" && selectedMediaIds.length >= 2) {
        updateData.post_data = {
          message: content.trim() || undefined,
          image_ids: selectedMediaIds,
        };
      } else if (postType === "story_image" && selectedMediaId) {
        updateData.post_data = {
          media_id: selectedMediaId,
        };
      } else if (postType === "story_video" && selectedMediaId) {
        updateData.post_data = {
          media_id: selectedMediaId,
        };
      }

      await updateScheduledPost(editingPost.scheduled_post_id, updateData);
      
      // Reload scheduled posts and reset form
      await loadScheduledPosts({ platform: 'facebook' });
      setShowModal(false);
      setEditingPost(null);
      setContent("");
      setPreviewUrls([]);
      setSelectedMediaId(null);
      setSelectedMediaIds([]);
      setSelectedMediaItems([]);
      setPostType("text");
      setScheduledDate(new Date());
      alert("Post updated successfully!");
    } catch (err: any) {
      console.error("Failed to update scheduled post:", err);
      alert(err.message || "Failed to update scheduled post. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!selectedPageId) {
      alert("Please select a Facebook page");
      return;
    }

    // Validate scheduled time is in the future
    if (scheduledDate <= new Date()) {
      alert("Please select a future date and time");
      return;
    }

    // Format scheduled time as ISO string with timezone
    const scheduledTime = scheduledDate.toISOString();

    // Show posting modal immediately
    setShowPostingModal(true);
    setPostingSuccess(false);

    try {
      setScheduling(true);
      setScheduleSuccess(false);

      if (postType === "text") {
        if (!content.trim()) {
          alert("Please enter post content");
          return;
        }

        await publishTextPost({
          message: content.trim(),
          page_id: selectedPageId,
          scheduled_time: scheduledTime,
        });
      } else if (postType === "image" && selectedMediaId) {
        const result = await createFacebookImagePost({
          image_id: selectedMediaId,
          page_id: selectedPageId,
          message: content.trim() || undefined,
          scheduled_time: scheduledTime,
        });

        if (!result.success) {
          throw new Error(result.message || result.error || "Failed to schedule image post");
        }
      } else if (postType === "video" && selectedMediaId) {
        const result = await createFacebookVideoPost({
          video_id: selectedMediaId,
          page_id: selectedPageId,
          description: content.trim() || undefined,
          scheduled_time: scheduledTime,
        });

        if (!result.success) {
          throw new Error(result.message || result.error || "Failed to schedule video post");
        }
      } else if (postType === "story_image" && selectedMediaId) {
        const result = await createFacebookImageStory({
          image_id: selectedMediaId,
          page_id: selectedPageId,
          scheduled_time: scheduledTime,
        });

        if (!result.success) {
          throw new Error(result.message || result.error || "Failed to schedule image story");
        }
      } else if (postType === "story_video" && selectedMediaId) {
        const result = await createFacebookVideoStory({
          video_id: selectedMediaId,
          page_id: selectedPageId,
          scheduled_time: scheduledTime,
        });

        if (!result.success) {
          throw new Error(result.message || result.error || "Failed to schedule video story");
        }
      } else if (postType === "carousel" && selectedMediaIds.length >= 2) {
        if (selectedMediaIds.length < 2) {
          alert("Carousel posts require at least 2 images");
          return;
        }
        if (selectedMediaIds.length > 10) {
          alert("Carousel posts support a maximum of 10 images");
          return;
        }
        
        const result = await createFacebookCarouselPost({
          image_ids: selectedMediaIds,
          page_id: selectedPageId,
          message: content.trim() || undefined,
          scheduled_time: scheduledTime,
        });

        if (!result.success) {
          throw new Error(result.message || result.error || "Failed to schedule carousel post");
        }
      } else if (postType === "image" && !selectedMediaId) {
        alert("Please select an image from storage or upload an image file");
        return;
      } else if (postType === "story_image" && !selectedMediaId) {
        alert("Please select an image from storage or upload an image file for story");
        return;
      } else if (postType === "story_video" && !selectedMediaId) {
        alert("Please select a video from storage or upload a video file for story");
        return;
      } else if (postType === "carousel" && selectedMediaIds.length < 2) {
        alert("Please select at least 2 images from storage or upload image files for carousel post");
        return;
      } else {
        alert("Please select media to post or use text post");
        return;
      }

      // Success - reload scheduled posts and reset form
      setScheduleSuccess(true);
      setPostingSuccess(true);
      setContent("");
      setPreviewUrls([]);
      setSelectedMediaId(null);
      setSelectedMediaIds([]);
      setSelectedMediaItems([]);
      setPostType("text");
      setScheduledDate(new Date());
      
      // Reload scheduled posts
      await loadScheduledPosts({ platform: 'facebook' });
      
      // Close posting modal after showing success
      setTimeout(() => {
        setShowPostingModal(false);
        setPostingSuccess(false);
      }, 1500);
      
      // Close scheduling modal after a short delay
      setTimeout(() => {
        setShowModal(false);
        setScheduleSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to schedule post:", err);
      setShowPostingModal(false);
      alert(err.message || "Failed to schedule post. Please try again.");
    } finally {
      setScheduling(false);
      // Hide posting modal after a short delay
      setTimeout(() => {
        setShowPostingModal(false);
      }, 500);
    }
  };

  const timeSlots = [
    { time: "9:00 AM", status: "empty" },
    { time: "12:00 PM", status: "empty" },
    { time: "3:00 PM", status: "empty" },
    { time: "6:00 PM", status: "empty" },
    { time: "9:00 PM", status: "string" },
    { time: "Custom Time", status: "empty" },
  ];

  const days = [
    { day: "Tuesday, November 4", slots: timeSlots },
    { day: "Thursday, November 6", slots: timeSlots },
  ];

  return (
    <div className="p-4 md:p-10 min-h-screen pb-20">
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          border: none;
          background: white;
          font-family: inherit;
          border-radius: 1.5rem;
          padding: 1rem;
        }
        .react-calendar__tile--active {
          background: #1877F2 !important;
          border-radius: 0.75rem;
        }
        .react-calendar__tile--now {
          background: #1877F2/10;
          border-radius: 0.75rem;
          color: #1877F2;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f8fafc;
          border-radius: 0.75rem;
        }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">Scheduled Posts</h1>
          <p className="text-sm md:text-base text-slate-500 font-bold">Manage your scheduled Facebook posts</p>
        </div>
        <Button 
          onClick={() => {
            setShowModal(true);
            // Reset form when opening modal
            setPostType("text");
            setContent("");
            setPreviewUrls([]);
            setSelectedMediaId(null);
            setSelectedMediaIds([]);
            setSelectedMediaItems([]);
            setScheduledDate(new Date());
            setScheduleSuccess(false);
          }}
          className="h-12 px-8 rounded-xl gap-3 font-black shadow-xl shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          New Post
        </Button>
      </div>

      <div className="space-y-12">
        {/* Your Scheduled Posts */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2">
            Your Scheduled Posts
              {total > 0 && (
                <span className="text-xs font-bold text-slate-400 normal-case">({total})</span>
              )}
          </h3>
            {selectedPlatform && (
              <button
                onClick={() => setSelectedPlatform(undefined)}
                className="text-xs font-bold text-primary hover:text-primary/80"
              >
                Clear filter
              </button>
            )}
          </div>

          {loadingScheduledPosts ? (
            <div className="bg-white rounded-4xl p-12 shadow-xl shadow-primary/5 border border-slate-100 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-slate-400 font-bold text-sm">Loading scheduled posts...</p>
            </div>
          ) : scheduledPostsError ? (
            <div className="bg-red-50 border border-red-200 rounded-4xl p-6 shadow-xl shadow-primary/5 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm font-bold text-red-700">{scheduledPostsError}</p>
            </div>
          ) : scheduledPosts.length === 0 ? (
          <div className="bg-white rounded-4xl p-12 shadow-xl shadow-primary/5 border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No scheduled or failed posts found</h3>
            <p className="text-slate-400 font-bold text-sm">Schedule a post to see it here</p>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledPosts.map((post) => (
                <div
                  key={post.scheduled_post_id}
                  className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {/* Header with status badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      post.status === "scheduled" 
                        ? "bg-blue-50 text-blue-600" 
                        : post.status === "published"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    )}>
                      {post.status}
                    </div>
                    <div className="flex items-center gap-1">
                      {post.status === "scheduled" && (
                        <button
                          onClick={() => handleEditPost(post)}
                          className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary flex items-center justify-center transition-colors"
                          title="Edit post"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePost(post.scheduled_post_id)}
                        disabled={deletingPostId === post.scheduled_post_id}
                        className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Delete post"
                      >
                        {deletingPostId === post.scheduled_post_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Post type badge */}
                  <div className="mb-3">
                    <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                      {post.post_type}
                    </span>
                  </div>
                  
                  {/* Content preview */}
                  {post.post_data?.message && (
                    <p className="text-slate-900 font-bold text-sm mb-3 line-clamp-3 flex-1">
                      {post.post_data.message}
                    </p>
                  )}
                  
                  {/* Media preview */}
                  {post.media?.media_urls && post.media.media_urls.length > 0 && (
                    <div className="mb-3 rounded-lg overflow-hidden aspect-video bg-slate-100">
                      {post.media.media_urls[0].media_type === 'image' ? (
                        <img 
                          src={post.media.media_urls[0].public_url} 
                          alt="Post preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={post.media.media_urls[0].public_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Footer with time and actions */}
                  <div className="mt-auto pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-2">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="truncate">{post.scheduled_time_formatted || new Date(post.scheduled_time).toLocaleString()}</span>
                    </div>
                    {post.time_until_scheduled && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.time_until_scheduled}</span>
                      </div>
                    )}
                    {post.published_post_url && (
                      <a
                        href={post.published_post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-slate-600 hover:border-primary hover:text-primary text-xs font-black transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        View Post
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Schedule New Post Section */}
        <section>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 ml-1">Schedule New Post</h3>
          
          <div className="space-y-12">
            {days.map((day, dIdx) => (
              <div key={dIdx} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-lg font-black text-slate-900">{day.day}</h4>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {day.slots.map((slot, sIdx) => (
                    <div 
                      key={sIdx}
                      className="group bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {slot.time.split(' ')[0]}
                        </div>
                        <span className="font-bold text-slate-600 uppercase text-xs tracking-widest">{slot.time}</span>
                      </div>
                      
                      <button 
                        onClick={() => setShowModal(true)}
                        className={cn(
                          "h-10 px-5 rounded-lg border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                          slot.status === "string" 
                            ? "bg-slate-100 border-slate-200 text-slate-400" 
                            : "bg-white border-slate-100 text-primary hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {slot.status === "string" ? "Active" : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            New
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowModal(false);
                setShowCalendar(false);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-2xl sm:rounded-3xl md:rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] z-210 mx-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 sm:p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white z-20">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate pr-2">
                  {editingPost ? "Edit Scheduled Post" : "Schedule Facebook Post"}
                </h2>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setShowCalendar(false);
                    setEditingPost(null);
                    setContent("");
                    setPreviewUrls([]);
                    setSelectedMediaId(null);
                    setSelectedMediaIds([]);
                    setSelectedMediaItems([]);
                    setPostType("text");
                    setScheduledDate(new Date());
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] xl:grid-cols-[1fr_400px] gap-6 sm:gap-8 md:gap-10 items-start">
                  <div className="space-y-6 sm:space-y-8 md:space-y-10">
                    {/* Page selector removed - now using global page selector in header */}
                    {!selectedPageId && (
                      <div className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-start sm:items-center gap-2 sm:gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-yellow-800">No page selected</p>
                          <p className="text-[10px] sm:text-xs text-yellow-600">Please select a Facebook page from the header above</p>
                        </div>
                      </div>
                    )}

                    {/* Post Type Selector - EXACT SAME AS POST PAGE */}
                    <section>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 md:mb-6 ml-1">Select Post Type</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                        {postTypes.map((type) => {
                          const isActive = postType === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => {
                                setPostType(type.id as PostType);
                                setPreviewUrls([]);
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-center relative overflow-hidden group min-h-[90px] sm:min-h-[120px] md:min-h-[140px]",
                                isActive 
                                  ? "bg-primary/5 border-primary shadow-sm" 
                                  : "bg-white border-slate-100 hover:border-primary/20"
                              )}
                            >
                              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 flex items-center gap-1 sm:gap-1.5">
                                <div className={cn(
                                  "transition-colors",
                                  isActive ? "text-primary" : "text-slate-400"
                                )}>
                                  <type.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                </div>
                              {isActive && (
                                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 bg-white border-2 border-primary rounded-full flex items-center justify-center">
                                    <Check className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 text-primary stroke-3" />
                                </div>
                              )}
                              </div>
                              <div className="mt-4 sm:mt-0">
                                <h4 className={cn("font-black text-[10px] sm:text-xs md:text-sm lg:text-base", isActive ? "text-primary" : "text-slate-900")}>{type.title}</h4>
                                <p className="hidden xs:block text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-bold text-slate-400 tracking-tight leading-tight">{type.sub}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* Post Content - Hidden for Stories */}
                    {!postType.startsWith("story_") && (
                      <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {postType === "text" ? "Post Content" : "Caption"}
                        </h3>
                              <div className="bg-white rounded-2xl sm:rounded-4xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl shadow-primary/5 border border-slate-100">
                      <Textarea 
                                  placeholder={postType === "text" ? "What do you want to share?" : "Add a caption for your post..."}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                                  className="min-h-[120px] sm:min-h-[150px] md:min-h-[180px] text-sm sm:text-base md:text-lg border-none focus-visible:ring-0 p-2 sm:p-3 md:p-4 resize-none"
                                />
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
                            <span className="text-[9px] sm:text-[10px] font-black text-slate-300 tracking-widest uppercase">{content.length}/3000 characters</span>
                            <Button variant="ghost" className="text-primary gap-1.5 font-bold rounded-xl h-8 sm:h-9 text-[10px] sm:text-xs px-3 sm:px-4 w-full sm:w-auto">
                              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              AI Assist
                            </Button>
                          </div>
                      </div>
                    </section>
                    )}

                    {/* Media Upload */}
                    {(postType !== "text") && (
                      <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Media Upload</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <button 
                            onClick={() => setShowStorageModal(true)}
                            className="flex items-center gap-3 sm:gap-4 h-28 sm:h-32 px-4 sm:px-6 rounded-xl sm:rounded-4xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold hover:border-primary/50 hover:bg-primary/5 transition-all group"
                          >
                             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-hover:text-primary" />
                             </div>
                             <div className="text-left">
                              <p className="font-black text-slate-900 text-xs sm:text-sm">Storage</p>
                              <p className="text-[9px] sm:text-[10px] text-slate-400">Select from media</p>
                             </div>
                          </button>
                          
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="relative h-28 sm:h-32 rounded-xl sm:rounded-4xl border-2 border-dashed border-slate-200 bg-white flex items-center px-4 sm:px-6 gap-3 sm:gap-4 group hover:border-primary transition-all overflow-hidden cursor-pointer"
                          >
                            <input 
                              ref={fileInputRef}
                              type="file" 
                              className="hidden"
                              onChange={handleFileChange}
                              multiple={postType === "carousel"}
                              accept={postType.includes("video") ? "video/*" : "image/*"}
                            />
                            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <p className="font-black text-slate-900 text-sm">Click to upload</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{postType.includes('video') ? 'MP4 / WEBM' : 'JPG, PNG, GIF'}</p>
                            </div>
                          </div>
                        </div>
                        {uploadProgress > 0 && (
                          <div className="mt-3 w-full">
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{uploadProgress}%</p>
                          </div>
                        )}
                      </section>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr] gap-4 sm:gap-6 md:gap-8 items-start">
                    {/* Visibility */}
                      <section className="space-y-3 sm:space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visibility</h3>
                        <div className="relative">
                          <button
                            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                            className="w-full h-11 sm:h-12 md:h-14 bg-white rounded-xl sm:rounded-2xl border-2 border-slate-100 px-3 sm:px-4 md:px-6 flex items-center justify-between font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 hover:border-primary transition-all shadow-sm group"
                          >
                            <span className="flex items-center gap-2 truncate">
                              {visibility === "public" ? <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" /> : <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />}
                              <span className="truncate">{visibility === "public" ? "Public" : "Friends"}</span>
                            </span>
                            <MoreHorizontal className={cn("w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 rotate-90 transition-transform duration-300 shrink-0", showVisibilityDropdown ? "scale-125 text-primary" : "")} />
                          </button>

                          <AnimatePresence>
                            {showVisibilityDropdown && (
                              <>
                                <div 
                                  className="fixed inset-0 z-110" 
                                  onClick={() => setShowVisibilityDropdown(false)} 
                                />
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute top-full mt-2 left-0 right-0 z-120 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 overflow-hidden"
                                >
                                  {[
                                    { id: "public", label: "Public", sub: "Anyone on Facebook", icon: Globe },
                                    { id: "connections", label: "Friends", sub: "Only your friends", icon: Users }
                                  ].map((option) => (
                                    <button
                                      key={option.id}
                                      onClick={() => {
                                        setVisibility(option.id as Visibility);
                                        setShowVisibilityDropdown(false);
                                      }}
                                      className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                                        visibility === option.id ? "bg-primary text-white" : "hover:bg-slate-50"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                        visibility === option.id ? "bg-white/20" : "bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary"
                                      )}>
                                        <option.icon className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <p className="font-black text-sm">{option.label}</p>
                                        <p className={cn("text-[10px] font-bold", visibility === option.id ? "text-white/70" : "text-slate-400")}>{option.sub}</p>
                                      </div>
                                      {visibility === option.id && (
                                        <Check className="ml-auto w-4 h-4 text-white" />
                                      )}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                    </section>

                      {/* Scheduled Time - WITH CALENDAR AND TIME PICKER */}
                      <section className="space-y-3 sm:space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5" />
                        Scheduled Time
                      </h3>
                        <div className="space-y-3 sm:space-y-4">
                          {/* Date Picker */}
                          <div className="relative">
                            <button 
                              onClick={() => setShowCalendar(!showCalendar)}
                              className="w-full h-11 sm:h-12 md:h-14 bg-white rounded-xl sm:rounded-2xl border-2 border-slate-100 px-3 sm:px-4 md:px-6 flex items-center justify-between font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 hover:border-primary hover:bg-primary/2 transition-all shadow-sm group"
                            >
                              <span className="flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                                {scheduledDate.toLocaleDateString()}
                              </span>
                              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                                <Plus className={cn("w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300", showCalendar ? "rotate-45" : "")} />
                              </div>
                            </button>
                            
                            <AnimatePresence>
                              {showCalendar && (
                                <>
                                  <div
                                    className="fixed inset-0 z-110"
                                    onClick={() => setShowCalendar(false)}
                                  />
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full mb-2 sm:mb-4 left-0 right-0 z-120 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-2 sm:p-3 overflow-hidden max-h-[400px] sm:max-h-none"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Calendar 
                                      onChange={(val) => {
                                        const newDate = val as Date;
                                        // Preserve the time when changing date
                                        const currentTime = scheduledDate;
                                        newDate.setHours(currentTime.getHours());
                                        newDate.setMinutes(currentTime.getMinutes());
                                        setScheduledDate(newDate);
                                        setShowCalendar(false);
                                      }} 
                                      value={scheduledDate}
                                      minDate={new Date()}
                                    />
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                Hour
                              </label>
                              <div className="relative group">
                                <input
                                  type="number"
                                  min="0"
                                  max="23"
                                  value={scheduledDate.getHours()}
                                  onChange={(e) => {
                                    const hours = parseInt(e.target.value) || 0;
                                    const newDate = new Date(scheduledDate);
                                    newDate.setHours(Math.max(0, Math.min(23, hours)));
                                    setScheduledDate(newDate);
                                  }}
                                  className="w-full h-10 sm:h-12 md:h-14 bg-white rounded-xl sm:rounded-2xl border-2 border-slate-100 px-3 sm:px-4 md:px-6 font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 hover:border-primary focus:border-primary focus:outline-none transition-all shadow-sm"
                                />
                                <Clock className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors pointer-events-none hidden xs:block" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                                Minute
                              </label>
                              <div className="relative group">
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  step="1"
                                  value={scheduledDate.getMinutes()}
                                  onChange={(e) => {
                                    const minutes = parseInt(e.target.value) || 0;
                                    const newDate = new Date(scheduledDate);
                                    newDate.setMinutes(Math.max(0, Math.min(59, minutes)));
                                    setScheduledDate(newDate);
                                  }}
                                  className="w-full h-10 sm:h-12 md:h-14 bg-white rounded-xl sm:rounded-2xl border-2 border-slate-100 px-3 sm:px-4 md:px-6 font-bold text-[10px] sm:text-xs md:text-sm text-slate-900 hover:border-primary focus:border-primary focus:outline-none transition-all shadow-sm"
                                />
                                <Clock className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors pointer-events-none hidden xs:block" />
                              </div>
                            </div>
                          </div>

                          {/* Display Selected Time */}
                          <div className="bg-primary/3 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 border-2 border-primary/10 transition-all hover:bg-primary/5 hover:border-primary/20">
                            <div className="flex items-center justify-between gap-2 md:gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-[7px] sm:text-[8px] md:text-[9px] font-black text-primary uppercase tracking-widest mb-0.5 sm:mb-1 opacity-70">Selected Schedule</p>
                                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-black text-slate-900 leading-tight">
                                  {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                              <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                              </div>
                            </div>
                          </div>
                        </div>
                    </section>
                    </div>
                  </div>

                  {/* Preview Side - EXACT SAME AS POST PAGE */}
                  <div className="w-full">
                    <div className="lg:sticky lg:top-0 space-y-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Live Preview</h3>
                      <div className={cn(
                        "bg-white border border-slate-100 shadow-2xl overflow-hidden transition-all duration-500",
                        postType.startsWith("story_") ? "rounded-3xl" : "rounded-4xl"
                      )}>
                         {/* Facebook Post Header - Hidden for Stories */}
                         {!postType.startsWith("story_") && (
                           <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs sm:text-base">MU</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-1">
                                  <span className="font-black text-slate-900 text-xs sm:text-sm truncate">Muhammad Uzair Yasin</span>
                                  <span className="text-slate-400 text-[10px] sm:text-xs font-medium">• Just now</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                  {visibility === "public" ? <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">{visibility === "public" ? "Public" : "Friends"}</span>
                            </div>
                          </div>
                              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" />
                       </div>
                         )}

                         {/* Post Content - Hidden for Stories */}
                         {!postType.startsWith("story_") && (
                           <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                             <p className={cn(
                               "text-slate-900 text-xs sm:text-sm leading-relaxed wrap-break-word whitespace-pre-wrap min-h-12 sm:min-h-16",
                               content ? "" : "text-slate-300 italic"
                             )}>
                           {content || "Start typing to see preview..."}
                         </p>
                       </div>
                         )}

                         {/* Media Previews */}
                         <AnimatePresence>
                           {previewUrls.length > 0 ? (
                             <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="relative"
                             >
                               {postType.includes("video") ? (
                                 <div className={cn(
                                   "bg-black flex items-center justify-center relative",
                                   postType === "story_video" ? "aspect-9/16" : "aspect-video"
                                 )}>
                                    <video 
                                      src={previewUrls[0]} 
                                      className="w-full h-full object-contain" 
                                      controls 
                                    />
                                 </div>
                               ) : postType === "carousel" ? (
                                 <div className={cn(
                                   "grid gap-1 bg-slate-100 px-4",
                                   previewUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
                                 )}>
                                    {previewUrls.slice(0, 4).map((url, i) => {
                                      const mediaItem = selectedMediaItems[i];
                                      const isVideo = mediaItem?.media_type === 'video';
                                      return (
                                      <div key={i} className="aspect-square relative overflow-hidden group first:rounded-tl-xl last:rounded-br-xl even:rounded-tr-xl odd:rounded-bl-xl">
                                        {isVideo ? (
                                          <video src={url} className="w-full h-full object-cover rounded-lg" controls playsInline />
                                        ) : (
                                          <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                                        )}
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (postType === 'carousel' && selectedMediaItems.length > 0) {
                                              const itemToRemove = selectedMediaItems[i];
                                              if (itemToRemove) {
                                                setSelectedMediaIds(prev => prev.filter(id => id !== itemToRemove.media_id));
                                                setSelectedMediaItems(prev => prev.filter((_, idx) => idx !== i));
                                                setPreviewUrls(prev => prev.filter((_, idx) => idx !== i));
                                              }
                                            } else {
                                              removeFile(i);
                                            }
                                          }}
                                          className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        {i === 3 && previewUrls.length > 4 && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-2xl rounded-lg">
                                            +{previewUrls.length - 3}
                                          </div>
                                        )}
                                      </div>
                                      );
                                    })}
                                 </div>
                               ) : (
                                 <div className={cn(
                                   "relative bg-slate-50 group border-y border-slate-100",
                                   postType === "story_image" ? "aspect-9/16" : "aspect-video"
                                 )}>
                                   <img src={previewUrls[0]} alt="" className="w-full h-full object-cover" />
                                   <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewUrls([]);
                                        setSelectedMediaId(null);
                                      }}
                                      className="absolute top-4 right-4 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                 </div>
                               )}
                             </motion.div>
                           ) : postType.startsWith("story_") && (
                             <div className="aspect-9/16 bg-slate-50 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                               <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                               <p className="text-sm font-bold uppercase tracking-widest">Story Preview</p>
                               <p className="text-[10px] mt-2 font-medium">Upload media to see preview</p>
                             </div>
                           )}
                         </AnimatePresence>

                         {/* Interaction Buttons - Hidden for Stories */}
                         {!postType.startsWith("story_") && (
                       <div className="px-1 sm:px-2 py-1 border-t border-slate-50 flex items-center justify-between">
                          {[{icon: ThumbsUp, label: "Like"}, {icon: MessageSquare, label: "Comment"}, {icon: Repeat2, label: "Repost"}, {icon: SendIcon, label: "Send"}].map((btn, i) => (
                                <button key={i} className="flex flex-1 items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 text-slate-500 font-bold text-[9px] sm:text-[10px] md:text-[11px] hover:bg-slate-50 rounded-lg sm:rounded-xl transition-colors">
                                  <btn.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                              <span className="hidden xs:inline">{btn.label}</span>
                                </button>
                          ))}
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 md:p-6 lg:p-8 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-4 bg-white z-20">
                {scheduleSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-[10px] sm:text-xs md:text-sm font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    Post scheduled successfully!
                  </div>
                )}
                <div className="flex gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowModal(false);
                      setShowCalendar(false);
                      setScheduleSuccess(false);
                      setEditingPost(null);
                      // Reset form
                      setPostType("text");
                      setContent("");
                      setPreviewUrls([]);
                      setSelectedMediaId(null);
                      setSelectedMediaIds([]);
                      setSelectedMediaItems([]);
                      setScheduledDate(new Date());
                    }}
                    className="h-9 sm:h-10 md:h-11 lg:h-12 px-4 sm:px-6 lg:px-8 rounded-xl font-bold border-slate-200 text-slate-500 hover:bg-slate-100 flex-1 sm:flex-initial text-[10px] sm:text-xs md:text-sm"
                    disabled={scheduling}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingPost ? handleUpdatePost : handleSchedulePost}
                    disabled={
                      scheduling || 
                      !selectedPageId || 
                      (postType === "text" && !content.trim()) ||
                      (postType === "image" && !selectedMediaId) ||
                      (postType === "video" && !selectedMediaId) ||
                      (postType === "story_image" && !selectedMediaId) ||
                      (postType === "story_video" && !selectedMediaId) ||
                      (postType === "carousel" && selectedMediaIds.length < 2)
                    }
                    className="h-9 sm:h-10 md:h-11 lg:h-12 px-4 sm:px-6 md:px-8 lg:px-10 rounded-xl font-black gap-1.5 sm:gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 disabled:opacity-50 flex-1 sm:flex-initial text-[10px] sm:text-xs md:text-sm lg:text-base"
                  >
                    {scheduling ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 animate-spin" />
                        {editingPost ? "Updating..." : "Scheduling..."}
                      </>
                    ) : (
                      <>
                        <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                        {editingPost ? "Update Post" : "Schedule Post"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Storage Modal */}
      <AnimatePresence>
        {showStorageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-220 flex items-center justify-center p-4"
            onClick={() => setShowStorageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-4xl p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate">Select from Storage</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                    {postType === 'carousel' 
                      ? `Select multiple media (${selectedMediaIds.length} selected)`
                      : 'Choose a media file from your storage'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {postType === 'carousel' && selectedMediaIds.length > 0 && (
                    <Button
                      onClick={() => setShowStorageModal(false)}
                      className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 font-black text-xs sm:text-sm"
                    >
                      Done ({selectedMediaIds.length})
                    </Button>
                  )}
                  <button
                    onClick={() => setShowStorageModal(false)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {loadingStorage ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : storageMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Database className="w-16 h-16 text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">No media found in storage</p>
                  <p className="text-sm text-slate-400 mt-2">Upload media from the storage page first</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {storageMedia.map((media) => {
                      const isSelected = postType === 'carousel' 
                        ? selectedMediaIds.includes(media.media_id)
                        : selectedMediaId === media.media_id;
                      return (
                      <motion.div
                        key={media.media_id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => handleSelectFromStorage(media)}
                        className={cn(
                          "relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group transition-all",
                          isSelected ? "border-3 sm:border-4 border-primary" : "border-2 border-transparent hover:border-primary"
                        )}
                      >
                        {media.media_type === "image" ? (
                          <img 
                            src={media.public_url} 
                            alt={media.filename}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <video 
                            src={media.public_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur-md rounded-md sm:rounded-lg flex items-center gap-1 sm:gap-1.5">
                          {media.media_type === "image" ? (
                            <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          ) : (
                            <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          )}
                          <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest">
                            {media.media_type}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-linear-to-t from-black/80 to-transparent">
                          <p className="text-white text-[10px] sm:text-xs font-bold truncate">{media.filename}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center z-10">
                            <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                          </div>
                        )}
                      </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posting Modal */}
      <AnimatePresence>
        {showPostingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-230 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-4xl p-8 max-w-md w-full text-center"
            >
              <div className="flex flex-col items-center gap-4">
                {postingSuccess ? (
                  <>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Post Scheduled Successfully!</h3>
                      <p className="text-sm text-slate-500 font-bold">
                        Your post has been scheduled for Facebook.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Creating Your Post</h3>
                      <p className="text-sm text-slate-500 font-bold">
                        Please wait while we schedule your post...
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}