"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, 
  Copy, 
  Video as VideoIcon,
  Check, 
  Upload, 
  MoreHorizontal, 
  ThumbsUp, 
  MessageSquare, 
  Repeat2, 
  Send as SendIcon,
  Globe,
  Users,
  Sparkles,
  Database,
  X,
  Type,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useFacebookTextPost } from "@/lib/hooks/facebook/textPost/useFacebookTextPost";
import { getMedia, uploadMedia, listMedia, type MediaItem } from "@/lib/hooks/media/api";
import { useSearchParams } from "next/navigation";
import { createFacebookImagePost } from "@/lib/hooks/facebook/imagePost/api";
import { createFacebookCarouselPost } from "@/lib/hooks/facebook/carouselPost/api";
import { createFacebookVideoPost } from "@/lib/hooks/facebook/videoPost/api";
import { createFacebookImageStory, createFacebookVideoStory } from "@/lib/hooks/facebook/storyPost/api";
import { useContentGenerator } from "@/lib/hooks/facebook/contentGenerator/useContentGenerator";
import type { ContentGenerationResponse } from "@/lib/hooks/facebook/contentGenerator/api";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";

type PostType = "text" | "image" | "carousel" | "video" | "story_image" | "story_video";
type Visibility = "public" | "connections";

function PostPageContent() {
  const searchParams = useSearchParams();
  const [postType, setPostType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]); // For carousel
  const [selectedMediaItems, setSelectedMediaItems] = useState<MediaItem[]>([]); // For carousel preview
  const { selectedPage, setSelectedPage, pages } = useSelectedPage();
  const selectedPageId = selectedPage?.page_id || "";
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageMedia, setStorageMedia] = useState<any[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showGenerateIdeaModal, setShowGenerateIdeaModal] = useState(false);
  const [showGenerateContentModal, setShowGenerateContentModal] = useState(false);
  const [showGenerateImageModal, setShowGenerateImageModal] = useState(false);
  const [showEditImageModal, setShowEditImageModal] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [postIdea, setPostIdea] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [contentIdea, setContentIdea] = useState("");
  const [contentRequirements, setContentRequirements] = useState("");
  const [imageContent, setImageContent] = useState("");
  const [imageRequirements, setImageRequirements] = useState("");
  const [useExistingContent, setUseExistingContent] = useState(true);
  const [editImageRequirements, setEditImageRequirements] = useState("");
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [postingSuccess, setPostingSuccess] = useState(false);
  const [showPublishConfirmModal, setShowPublishConfirmModal] = useState(false);
  const [showImageToContentModal, setShowImageToContentModal] = useState(false);
  const [showVideoToContentModal, setShowVideoToContentModal] = useState(false);
  const [imageToContentRequirements, setImageToContentRequirements] = useState("");
  const [videoToContentRequirements, setVideoToContentRequirements] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { publishTextPost, loading, error, lastPost } = useFacebookTextPost();

  // Content Generator Hook - Use Case 1: Generate post with image
  const contentGeneratorWithImage = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Check if it's ContentGenerationResponse (has content property)
      if ('content' in result) {
        // Use Case 1: Full post with image
        const contentResult = result as ContentGenerationResponse;
        setContent(contentResult.content);
        if (contentResult.image_url && contentResult.media_id) {
          if (postType === "text") {
            setPostType("image");
          }
          setSelectedMediaId(contentResult.media_id);
          setPreviewUrls([contentResult.image_url]);
        }
        setShowGenerateIdeaModal(false);
        setPostIdea("");
        setAdditionalRequirements("");
      }
    },
    onError: (error) => {
      alert(error.message || "Failed to generate content. Please make sure you have built a persona for this page.");
    },
  });

  // Content Generator Hook - Use Case 2: Generate content only (with regeneration support)
  const contentGeneratorOnly = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Use Case 2: Content only (no image)
      // Check if it's ContentGenerationResponse or EnhanceContentResponse (has content property)
      if ('content' in result) {
        const contentResult = result as ContentGenerationResponse | { content: string };
        setContent(contentResult.content);
        setShowGenerateContentModal(false);
        setContentIdea("");
        setContentRequirements("");
      }
    },
    onError: (error) => {
      alert(error.message || "Failed to generate content. Please make sure you have built a persona for this page.");
    },
  });

  // Content Generator Hook - Use Case 3: Enhance existing content
  const contentEnhancer = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Use Case 3: Enhance existing content
      // Check if it's EnhanceContentResponse (has content property)
      if ('content' in result) {
        const contentResult = result as { content: string };
        setContent(contentResult.content);
        setShowAIModal(false);
        setAiInput("");
      }
    },
    onError: (error) => {
      alert(error.message || "Failed to enhance content. Please make sure you have built a persona for this page.");
    },
  });

  // Image Generator Hook - Use Case 4: Generate image from content
  const imageGenerator = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Use Case 4: Generate image from content
      // ContentToImageResponse only has image_url and media_id (no content property)
      if ('image_url' in result && result.image_url && 'media_id' in result && result.media_id) {
        setSelectedMediaId(result.media_id);
        setPreviewUrls([result.image_url]);
        setShowGenerateImageModal(false);
        setImageContent("");
        setImageRequirements("");
        setUseExistingContent(true);
      }
    },
    onError: (error) => {
      alert(error.message || "Failed to generate image. Please make sure you have built a persona for this page.");
    },
  });

  // Image Editor Hook - Use Case 5: Edit existing image
  const imageEditor = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Use Case 5: Edit existing image - result contains new image
      // ContentToImageResponse only has image_url and media_id (no content property)
      // The hook's lastEditedImage state will have both old and new images
      // We'll show them in the modal for user to choose
      // Modal will automatically show comparison view
    },
    onError: (error) => {
      alert(error.message || "Failed to edit image. Please make sure you have built a persona for this page.");
    },
  });

  // Image to Content Hook - Use Case 6: Generate content from image
  const imageToContentGenerator = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Use Case 6: Generate content from image
      // MediaToContentResponse has data.content
      if ('data' in result && result.data && 'content' in result.data) {
        setContent(result.data.content);
        setShowImageToContentModal(false);
        setImageToContentRequirements("");
      }
    },
    onError: (error) => {
      alert(error.message || "Failed to generate content from image. Please make sure you have built a persona for this page.");
    },
  });

  // Video to Content Hook - Use Case 7: Generate content from video
  const videoToContentGenerator = useContentGenerator({
    pageId: selectedPageId,
    onSuccess: (result) => {
      // Use Case 7: Generate content from video
      // MediaToContentResponse has data.content
      if ('data' in result && result.data && 'content' in result.data) {
        setContent(result.data.content);
        setShowVideoToContentModal(false);
        setVideoToContentRequirements("");
      }
    },
    onError: (error) => {
      alert(error.message || "Failed to generate content from video. Please make sure you have built a persona for this page.");
    },
  });

  // Use Case 4: Generate image from content
  const handleGenerateImage = async () => {
    const contentToUse = useExistingContent ? content.trim() : imageContent.trim();

    if (!contentToUse) {
      alert(useExistingContent 
        ? "Please add content to the textarea first or uncheck 'Use content from textarea'" 
        : "Please provide content to generate image from");
      return;
    }

    try {
      await imageGenerator.generateImageFromContent(
        contentToUse,
        imageRequirements.trim() || undefined
      );
    } catch (err) {
      // Error is handled by the hook's onError callback
      console.error("Failed to generate image:", err);
    }
  };

  // Use Case 5: Edit existing image
  const handleEditImage = async () => {
    if (!selectedImageForEdit) {
      alert("Please select an image to edit");
      return;
    }

    if (!editImageRequirements.trim()) {
      alert("Please provide requirements for image editing");
      return;
    }

    try {
      await imageEditor.editExistingImage(
        selectedImageForEdit,
        editImageRequirements.trim(),
        content.trim() || undefined
      );
    } catch (err) {
      // Error is handled by the hook's onError callback
      console.error("Failed to edit image:", err);
    }
  };

  // Handle image selection for editing
  const handleSelectImageForEdit = async (imageUrl: string) => {
    // If it's a blob URL, we need to get the public_url from the media
    if (imageUrl.startsWith('blob:')) {
      if (selectedMediaId) {
        try {
          const media = await getMedia(selectedMediaId);
          if (media.success && media.public_url) {
            setSelectedImageForEdit(media.public_url);
            setShowEditImageModal(true);
            return;
          }
        } catch (err) {
          console.error("Failed to get media:", err);
          alert("Failed to get image URL. Please try selecting the image again.");
          return;
        }
      } else {
        alert("No media selected. Please select an image first.");
        return;
      }
    }
    
    // Use the URL directly if it's already a public URL
    setSelectedImageForEdit(imageUrl);
    setShowEditImageModal(true);
  };

  // Handle choosing between old and new image after editing
  const handleChooseImage = (useNew: boolean) => {
    if (imageEditor.lastEditedImage) {
      if (useNew) {
        // Use the new edited image
        setSelectedMediaId(imageEditor.lastEditedImage.new_media_id);
        setPreviewUrls([imageEditor.lastEditedImage.new_image_url]);
      }
      // If useNew is false, we keep the old image (no changes needed)
      setShowEditImageModal(false);
      setEditImageRequirements("");
      setSelectedImageForEdit(null);
      imageEditor.reset();
    }
  };

  // Use Case 6: Generate content from image
  const handleGenerateContentFromImage = async () => {
    if (!selectedMediaId || previewUrls.length === 0) {
      alert("Please select an image first");
      return;
    }

    try {
      // Get the image URL from previewUrls or fetch from media
      let imageUrl = previewUrls[0];
      
      // If it's a blob URL, try to get the public URL from media
      if (imageUrl.startsWith('blob:')) {
        try {
          const media = await getMedia(selectedMediaId);
          if (media.success && media.public_url) {
            imageUrl = media.public_url;
          }
        } catch (err) {
          console.error("Failed to get media:", err);
          alert("Failed to get image URL. Please try again.");
          return;
        }
      }

      await imageToContentGenerator.generateContentFromImageUrl(
        imageUrl,
        content.trim() || undefined,
        imageToContentRequirements.trim() || undefined
      );
    } catch (err) {
      // Error is handled by the hook's onError callback
      console.error("Failed to generate content from image:", err);
    }
  };

  // Use Case 7: Generate content from video
  const handleGenerateContentFromVideo = async () => {
    if (!selectedMediaId || previewUrls.length === 0) {
      alert("Please select a video first");
      return;
    }

    try {
      // Get the video URL from previewUrls or fetch from media
      let videoUrl = previewUrls[0];
      
      // If it's a blob URL, try to get the public URL from media
      if (videoUrl.startsWith('blob:')) {
        try {
          const media = await getMedia(selectedMediaId);
          if (media.success && media.public_url) {
            videoUrl = media.public_url;
          }
        } catch (err) {
          console.error("Failed to get media:", err);
          alert("Failed to get video URL. Please try again.");
          return;
        }
      }

      await videoToContentGenerator.generateContentFromVideoUrl(
        videoUrl,
        content.trim() || undefined,
        videoToContentRequirements.trim() || undefined
      );
    } catch (err) {
      // Error is handled by the hook's onError callback
      console.error("Failed to generate content from video:", err);
    }
  };

  // Load media from query parameter
  useEffect(() => {
    const mediaId = searchParams.get('media_id');
    const mediaType = searchParams.get('media_type');
    const postTypeParam = searchParams.get('post_type');
    
    if (mediaId && mediaType) {
      const loadMedia = async () => {
        try {
          setLoadingMedia(true);
          const response = await getMedia(mediaId);
          
          if (response.success && response.public_url) {
            // Store the media ID for posting
            setSelectedMediaId(mediaId);
            
            // Set post type from query parameter if provided, otherwise infer from media type
            if (postTypeParam && ['image', 'video', 'story_image', 'story_video', 'carousel'].includes(postTypeParam)) {
              setPostType(postTypeParam as PostType);
            } else {
              // Fallback: Set the appropriate post type based on media type
              if (mediaType === 'image') {
                setPostType('image');
              } else if (mediaType === 'video') {
                setPostType('video');
              }
            }
            
            setPreviewUrls([response.public_url]);
            
            // Remove query parameters from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('media_id');
            url.searchParams.delete('media_type');
            url.searchParams.delete('post_type');
            window.history.replaceState({}, '', url.toString());
          }
        } catch (err) {
          console.error("Failed to load media:", err);
        } finally {
          setLoadingMedia(false);
        }
      };
      
      loadMedia();
    }
  }, [searchParams]);

  // Reset success message after 5 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Load storage media when modal opens
  useEffect(() => {
    if (showStorageModal) {
      const loadStorageMedia = async () => {
        try {
          setLoadingStorage(true);
          
          // Determine media type filter based on post type
          // Photo post type: only show images
          // Video post type: only show videos
          // Story types: show both (no filter)
          // Carousel and other types: show all (no filter)
          let mediaTypeFilter: 'image' | 'video' | undefined = undefined;
          
          if (postType === 'image') {
            mediaTypeFilter = 'image';
          } else if (postType === 'video') {
            mediaTypeFilter = 'video';
          }
          // For story_image, story_video, carousel, and other types, show all (no filter)
          
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
    // For carousel, support multiple selection
    if (postType === 'carousel') {
      const isSelected = selectedMediaIds.includes(media.media_id);
      
      if (isSelected) {
        // Deselect
        setSelectedMediaIds(prev => prev.filter(id => id !== media.media_id));
        setSelectedMediaItems(prev => prev.filter(item => item.media_id !== media.media_id));
        setPreviewUrls(prev => {
          const itemIndex = selectedMediaItems.findIndex(item => item.media_id === media.media_id);
          return prev.filter((_, index) => index !== itemIndex);
        });
      } else {
        // Select
        setSelectedMediaIds(prev => [...prev, media.media_id]);
        setSelectedMediaItems(prev => [...prev, media]);
        setPreviewUrls(prev => [...prev, media.public_url]);
      }
      // Don't close modal for carousel - allow multiple selections
      return;
    }
    
    // For non-carousel types, single selection
    setSelectedMediaId(media.media_id);
    setPreviewUrls([media.public_url]);
    setSelectedMediaIds([]); // Clear carousel selection
    setSelectedMediaItems([]); // Clear carousel items
    
    // Preserve current post type if it's compatible with selected media
    // Only change if incompatible or if currently on text post
    const currentType = postType;
    const mediaType = media.media_type;
    
    if (currentType === 'text') {
      // If currently on text post, set appropriate type based on media
      if (mediaType === 'image') {
        setPostType('image');
      } else if (mediaType === 'video') {
        setPostType('video');
      }
    } else if (currentType === 'story_image') {
      // If on story_image, keep it (images are compatible)
      // Only change if video is selected
      if (mediaType === 'video') {
        setPostType('story_video');
      }
      // Otherwise keep story_image
    } else if (currentType === 'story_video') {
      // If on story_video, keep it (videos are compatible)
      // Only change if image is selected
      if (mediaType === 'image') {
        setPostType('story_image');
      }
      // Otherwise keep story_video
    } else if (currentType === 'image' && mediaType !== 'image') {
      // If on image post but selected video, switch to video
      setPostType('video');
    } else if (currentType === 'video' && mediaType !== 'video') {
      // If on video post but selected image, switch to image
      setPostType('image');
    }
    // For all other cases, keep the current post type
    
    // Close modal for single selection
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
        
        // Upload the file and get media_id
        if (files.length > 0) {
          setUploading(true);
          setUploadProgress(0);
          try {
            const file = files[0];
            const isVideo = file.type.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'image';

            const result = await uploadMedia({
              media: file,
              media_type: mediaType,
              platform: 'facebook',
              onProgress: setUploadProgress,
            });
            setUploadProgress(100);
            if (result.success && 'media_id' in result && result.media_id) {
              setSelectedMediaId(result.media_id);
              // Update previewUrls with public_url from response (not blob URL)
              if ('public_url' in result && result.public_url) {
                setPreviewUrls([result.public_url]);
              }
              // Update post type if needed
              if (isVideo && postType !== 'video') {
                setPostType('video');
              } else if (!isVideo && postType !== 'image') {
                setPostType('image');
              }
            }
          } catch (err) {
            console.error("Failed to upload file:", err);
            alert("Failed to upload file. Please try again.");
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }
      }
    }
  };

  const removeFile = (index: number) => {
    if (postType === 'carousel' && selectedMediaItems.length > 0) {
      // Remove from carousel selection
      const itemToRemove = selectedMediaItems[index];
      if (itemToRemove) {
        setSelectedMediaIds(prev => prev.filter(id => id !== itemToRemove.media_id));
        setSelectedMediaItems(prev => prev.filter((_, idx) => idx !== index));
        setPreviewUrls(prev => prev.filter((_, idx) => idx !== index));
      }
    } else {
      setPreviewUrls(prev => prev.filter((_, i) => i !== index));
      // Clear media ID when removing file
      if (previewUrls.length === 1) {
        setSelectedMediaId(null);
      }
    }
  };

  // Use Case 3: Enhance existing content (AI Assist button in textarea)
  const handleEnhanceContent = async () => {
    if (!content.trim()) {
      alert("Please enter some content to enhance");
      return;
    }

    try {
      await contentEnhancer.enhanceExistingContent(content, aiInput.trim() || undefined);
    } catch (err) {
      // Error is handled by the hook's onError callback
      console.error("Failed to enhance content:", err);
    }
  };

  // Use Case 1: Generate post with image from idea
  const handleGenerateFromIdea = async () => {
    if (!postIdea.trim()) {
      alert("Please enter a post idea");
      return;
    }

    try {
      await contentGeneratorWithImage.generatePostWithImage(
        postIdea.trim(),
        additionalRequirements.trim() || undefined
      );
    } catch (err) {
      // Error is handled by the hook's onError callback
      console.error("Failed to generate content:", err);
    }
  };

  // Use Case 2: Generate content only (no image)
  // - When user has content in editor: regenerate from last saved draft (backend loads from DB; only send requirements).
  // - When user has no content: generate from idea (send content = idea + requirements).
  const handleGenerateContentOnly = async () => {
    const hasContentInEditor = content.trim().length > 0;
    const hasIdea = contentIdea.trim().length > 0;

    if (hasContentInEditor) {
      try {
        await contentGeneratorOnly.regenerateFromDraft(contentRequirements.trim() || undefined);
      } catch (err) {
        console.error("Failed to regenerate from draft:", err);
      }
      return;
    }

    if (!hasIdea) {
      alert("Please enter a post idea, or add content first and use 'Generate content only' to regenerate from your last draft.");
      return;
    }

    try {
      await contentGeneratorOnly.generateContentOnly(
        contentIdea.trim(),
        contentRequirements.trim() || undefined
      );
    } catch (err) {
      console.error("Failed to generate content:", err);
    }
  };

  const handlePost = async () => {
    if (!selectedPageId) {
      alert("Please select a Facebook page");
      return;
    }

    setShowPublishConfirmModal(false);
    setShowPostingModal(true);
    setPostingSuccess(false);

    try {
      setShowSuccess(false);

      if (postType === "text") {
        if (!content.trim()) {
          alert("Please enter post content");
          setShowPostingModal(false);
          return;
        }

        await publishTextPost({
          message: content.trim(),
          page_id: selectedPageId,
        });

        setContent("");
        setShowSuccess(true);
        setPostingSuccess(true);
        if (lastPost?.permalink_url) {
          console.log("Post published successfully:", lastPost.permalink_url);
        }
        setTimeout(() => {
          setShowPostingModal(false);
          setPostingSuccess(false);
        }, 1500);
      } else if (postType === "image" && selectedMediaId) {
        // Image post
        const result = await createFacebookImagePost({
          image_id: selectedMediaId,
          page_id: selectedPageId,
          message: content.trim() || undefined,
        });

        if (result.success) {
          setShowSuccess(true);
          setContent("");
          setPreviewUrls([]);
          setSelectedMediaId(null);
          setPostType("text");
          setPostingSuccess(true);
          
          if (result.post?.permalink_url) {
            console.log("Image post published successfully:", result.post.permalink_url);
          }
          
          // Close modal after showing success
          setTimeout(() => {
            setShowPostingModal(false);
            setPostingSuccess(false);
          }, 1500);
        } else {
          throw new Error(result.message || result.error || "Failed to post image");
        }
      } else if (postType === "video" && selectedMediaId) {
        // Video post
        const result = await createFacebookVideoPost({
          video_id: selectedMediaId,
          page_id: selectedPageId,
          description: content.trim() || undefined,
        });

        if (result.success) {
          setShowSuccess(true);
          setContent("");
          setPreviewUrls([]);
          setSelectedMediaId(null);
          setPostType("text");
          setPostingSuccess(true);
          
          if (result.post?.permalink_url) {
            console.log("Video post published successfully:", result.post.permalink_url);
          }
          
          // Close modal after showing success
          setTimeout(() => {
            setShowPostingModal(false);
            setPostingSuccess(false);
          }, 1500);
        } else {
          throw new Error(result.message || result.error || "Failed to post video");
        }
      } else if (postType === "story_image" && selectedMediaId) {
        // Image story post
        const result = await createFacebookImageStory({
          image_id: selectedMediaId,
          page_id: selectedPageId,
        });

        if (result.success) {
          setShowSuccess(true);
          setContent("");
          setPreviewUrls([]);
          setSelectedMediaId(null);
          setPostType("text");
          setPostingSuccess(true);
          
          if (result.post?.permalink_url) {
            console.log("Image story published successfully:", result.post.permalink_url);
          }
          
          // Close modal after showing success
          setTimeout(() => {
            setShowPostingModal(false);
            setPostingSuccess(false);
          }, 1500);
        } else {
          throw new Error(result.message || result.error || "Failed to post image story");
        }
      } else if (postType === "story_video" && selectedMediaId) {
        // Video story post
        const result = await createFacebookVideoStory({
          video_id: selectedMediaId,
          page_id: selectedPageId,
        });

        if (result.success) {
          setShowSuccess(true);
          setContent("");
          setPreviewUrls([]);
          setSelectedMediaId(null);
          setPostType("text");
          setPostingSuccess(true);
          
          if (result.post?.permalink_url) {
            console.log("Video story published successfully:", result.post.permalink_url);
          }
          
          // Close modal after showing success
          setTimeout(() => {
            setShowPostingModal(false);
            setPostingSuccess(false);
          }, 1500);
        } else {
          throw new Error(result.message || result.error || "Failed to post video story");
        }
      } else if (postType === "carousel" && selectedMediaIds.length >= 2) {
        // Carousel post - requires 2-10 images
        if (selectedMediaIds.length < 2) {
          alert("Carousel posts require at least 2 images. Please select 2-10 images.");
          return;
        }
        if (selectedMediaIds.length > 10) {
          alert("Carousel posts support a maximum of 10 images. Please select fewer images.");
          return;
        }
        
        const result = await createFacebookCarouselPost({
          image_ids: selectedMediaIds,
          page_id: selectedPageId,
          message: content.trim() || undefined,
        });

        if (result.success) {
          setShowSuccess(true);
          setContent("");
          setPreviewUrls([]);
          setSelectedMediaIds([]);
          setSelectedMediaItems([]);
          setPostType("text");
          setPostingSuccess(true);
          
          if (result.post?.permalink_url) {
            console.log("Carousel post published successfully:", result.post.permalink_url);
          }
          
          // Close modal after showing success
          setTimeout(() => {
            setShowPostingModal(false);
            setPostingSuccess(false);
          }, 1500);
        } else {
          throw new Error(result.message || result.error || "Failed to post carousel");
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
    } catch (err: any) {
      console.error("Failed to post:", err);
      setShowPostingModal(false);
      setPostingSuccess(false);
      alert(err.message || "Failed to post. Please try again.");
    }
  };

  const postTypes = [
    { id: "text", title: "Text", sub: "Post text only", icon: Type },
    { id: "image", title: "Photo", sub: "Post a photo", icon: ImageIcon },
    { id: "video", title: "Video", sub: "Post a video", icon: VideoIcon },
    { id: "carousel", title: "Carousel", sub: "Post 2-10 images", icon: Copy },
    { id: "story_image", title: "Story (Image)", sub: "Create an image story", icon: Sparkles },
    { id: "story_video", title: "Story (Video)", sub: "Create a video story", icon: Sparkles },
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="mb-6 sm:mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">Create Post</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-bold">Compose and publish to your Facebook page(s)</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 md:gap-8 lg:gap-10 items-start">
        {/* Editor Side */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 sm:mb-4 ml-1">Select Post Type</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {postTypes.map((type) => {
                const isActive = postType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      const newType = type.id as PostType;
                      setPostType(newType);
                      if (type.id === "text") {
                        setPreviewUrls([]);
                        setSelectedMediaId(null);
                        setSelectedMediaIds([]);
                        setSelectedMediaItems([]);
                      } else if (newType === 'carousel') {
                        // When switching to carousel, clear single selection
                        setSelectedMediaId(null);
                      } else {
                        // When switching from carousel to single media type, clear carousel selections
                        setSelectedMediaIds([]);
                        setSelectedMediaItems([]);
                        setPreviewUrls([]);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 md:p-4 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-center relative overflow-hidden group",
                      isActive 
                        ? "bg-primary/5 border-primary shadow-sm" 
                        : "bg-white border-slate-100 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors",
                      isActive ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary"
                    )}>
                      <type.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <h4 className={cn("font-black text-[10px] sm:text-xs", isActive ? "text-slate-900" : "text-slate-500")}>{type.title}</h4>
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 tracking-tight leading-tight">{type.sub}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Caption / Post Content — same layout as LinkedIn/Instagram; shown for all post types */}
          <section className="space-y-4">
            <div className="flex items-center justify-between mb-3 ml-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {postType === "text" ? "Post Content" : "Caption"}
              </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => setShowGenerateIdeaModal(true)} disabled={!selectedPageId || contentGeneratorWithImage.loading}>
                    {contentGeneratorWithImage.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Idea to post
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => setShowAIModal(true)} disabled={!selectedPageId || contentEnhancer.loading || !content.trim()}>
                    {contentEnhancer.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Enhance
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => setShowImageToContentModal(true)} disabled={!selectedPageId || imageToContentGenerator.loading || !selectedMediaId || !previewUrls[0] || (postType !== "image" && postType !== "carousel")}>
                    {imageToContentGenerator.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    From image
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => setShowVideoToContentModal(true)} disabled={!selectedPageId || videoToContentGenerator.loading || !selectedMediaId || !previewUrls[0] || postType !== "video"}>
                    {videoToContentGenerator.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <VideoIcon className="w-3.5 h-3.5" />}
                    From video
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => setShowGenerateImageModal(true)} disabled={!selectedPageId || imageGenerator.loading}>
                    {imageGenerator.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    Generate image
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg gap-1.5 text-xs font-bold" onClick={() => previewUrls[0] && handleSelectImageForEdit(previewUrls[0])} disabled={!selectedPageId || imageEditor.loading || !selectedMediaId || !previewUrls[0] || (postType !== "image" && postType !== "carousel")}>
                    {imageEditor.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    Edit image
                  </Button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
                <Textarea
                  placeholder={postType === "text" ? "What do you want to share?" : "Add a caption for your post..."}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-sm sm:text-base md:text-lg border-none focus-visible:ring-0 p-2 resize-none min-h-[120px] md:min-h-[150px]"
                />
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-300 tracking-widest uppercase">{content.length}/3000 characters</span>
                </div>
              </div>
            </section>

          {/* Media — only when post type is not text; Storage + Upload cards */}
          {postType !== "text" && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Media</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowStorageModal(true)}
                  className="flex items-center gap-3 sm:gap-4 h-28 sm:h-32 px-4 sm:px-6 rounded-xl sm:rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold hover:border-primary/50 hover:bg-primary/5 transition-all text-left w-full"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                    <Database className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-xs sm:text-sm">Storage</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">Select from media</p>
                  </div>
                </button>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && !uploading && fileInputRef.current?.click()}
                  className={cn(
                    "relative h-28 sm:h-32 rounded-xl sm:rounded-[2rem] border-2 border-dashed border-slate-200 bg-white flex items-center px-4 sm:px-6 gap-3 sm:gap-4 transition-all overflow-hidden",
                    uploading ? "cursor-not-allowed opacity-70" : "hover:border-primary cursor-pointer"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple={postType === "carousel"}
                    accept={postType.includes("video") ? "video/*" : "image/*"}
                    disabled={uploading}
                  />
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0">
                    {uploading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Upload className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-xs sm:text-sm">{uploading ? "Uploading…" : "Click to upload"}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">{uploading ? "Please wait" : postType.includes("video") ? "MP4 / WEBM" : "JPG, PNG, GIF"}</p>
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

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-2.5 sm:p-3 flex items-center gap-2"
            >
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-red-700">{error}</span>
            </motion.div>
          )}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border-2 border-green-200 rounded-xl p-2.5 sm:p-3 flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-green-700">Post published successfully!</span>
              {lastPost?.permalink_url && (
                <a href={lastPost.permalink_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[10px] sm:text-xs font-bold text-green-600 hover:underline">
                  View Post →
                </a>
              )}
            </motion.div>
          )}

          {/* Post to — checkboxes for page(s) */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Post to</h3>
            <div className="flex flex-wrap gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              {pages.map((page) => (
                <label key={page.page_id} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPage?.page_id === page.page_id}
                    onChange={() => setSelectedPage(selectedPage?.page_id === page.page_id ? null : page)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-slate-700">{page.page_name ?? page.page_vanity_name ?? page.page_id}</span>
                </label>
              ))}
            </div>
            {!selectedPageId && (
              <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Select at least one page to publish.
              </p>
            )}
          </section>

          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-end">
            <section className="w-full md:w-auto space-y-3 sm:space-y-4">
              <Button
                className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl text-sm sm:text-base font-black gap-2 sm:gap-3 shadow-xl shadow-primary/20 px-6 sm:px-10 disabled:opacity-50"
                onClick={() => setShowPublishConfirmModal(true)}
                disabled={
                  loading ||
                  !selectedPageId ||
                  (postType === "text" && !content.trim()) ||
                  (postType === "image" && !selectedMediaId) ||
                  (postType === "video" && !selectedMediaId) ||
                  (postType === "story_image" && !selectedMediaId) ||
                  (postType === "story_video" && !selectedMediaId) ||
                  (postType === "carousel" && selectedMediaIds.length < 2)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    Post to Facebook
                  </>
                )}
              </Button>
            </section>
          </div>
        </div>

        {/* Preview Side */}
        <div className="w-full">
          <div className="xl:sticky xl:top-24 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Live Preview</h3>
            <div className={cn(
              "bg-white border border-slate-100 shadow-2xl overflow-hidden",
              postType.startsWith("story_") ? "rounded-3xl" : "rounded-[2rem]"
            )}>
               {/* Facebook Post Header - Hidden for Stories */}
               {!postType.startsWith("story_") && (
                 <div className="p-4 flex items-center gap-3">
                    {(() => {
                      const pageName = selectedPage?.page_name || selectedPageId || "Facebook Page";
                      const initials = pageName
                        .split(' ')
                        .map((word: string) => word[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'FB';
                      
                      return (
                        <>
                          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-black text-slate-900 text-sm">{pageName}</span>
                              <span className="text-slate-400 text-xs font-medium">• Just now</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                              {visibility === "public" ? <Globe className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                              <span className="text-[10px] font-bold uppercase tracking-wider">{visibility === "public" ? "Public" : "Friends"}</span>
                            </div>
                          </div>
                          <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </>
                      );
                    })()}
                 </div>
               )}

               {/* Post Content - Hidden for Stories */}
               {!postType.startsWith("story_") && (
                 <div className="px-4 pb-4">
                   <p className={cn(
                     "text-slate-900 text-sm leading-relaxed break-words whitespace-pre-wrap min-h-[4rem]",
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
                         postType === "story_video" ? "aspect-[9/16]" : "aspect-video"
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
                                    // Remove from carousel selection
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
                     ) : postType === "video" ? (
                       <div className="relative bg-black aspect-video">
                         <video 
                           src={previewUrls[0]} 
                           className="w-full h-full object-contain" 
                           controls
                           playsInline
                         />
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewUrls([]);
                            }}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                       </div>
                     ) : (
                       <div className={cn(
                         "relative bg-slate-50 group border-y border-slate-100",
                         postType === "story_image" ? "aspect-[9/16]" : "aspect-video"
                       )}>
                         <img src={previewUrls[0]} alt="" className="w-full h-full object-cover" />
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewUrls([]);
                            }}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                       </div>
                     )}
                   </motion.div>
                 ) : postType.startsWith("story_") && (
                   <div className="aspect-[9/16] bg-slate-50 flex flex-col items-center justify-center text-slate-300 p-8 text-center">
                     <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                     <p className="text-sm font-bold uppercase tracking-widest">Story Preview</p>
                     <p className="text-[10px] mt-2 font-medium">Upload an image or video to see how your story will look</p>
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
            
            <div className="bg-primary/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-primary/10">
               <p className="text-[10px] sm:text-xs font-black text-primary flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                 <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                 Pro Tip
               </p>
               <p className="text-[10px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                 Posts with images get <span className="text-primary font-black">2x more engagement</span>. Use our AI tool to optimize your professional voice!
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Modal */}
      <AnimatePresence>
        {showStorageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowStorageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-6 lg:p-8 max-w-6xl w-full mx-2 md:mx-4 flex flex-col max-h-[90vh] md:max-h-[90vh]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 md:mb-6">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">Select from Storage</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-bold mt-1">
                    {postType === 'carousel' 
                      ? `Select multiple media (${selectedMediaIds.length} selected)`
                      : 'Choose a media file from your storage'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {postType === 'carousel' && selectedMediaIds.length > 0 && (
                    <Button
                      onClick={() => setShowStorageModal(false)}
                      className="h-9 md:h-10 px-3 md:px-4 rounded-xl bg-primary hover:bg-primary/90 font-black text-xs md:text-sm"
                    >
                      Done ({selectedMediaIds.length})
                    </Button>
                  )}
                  <button
                    onClick={() => setShowStorageModal(false)}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              {loadingStorage ? (
                <div className="flex items-center justify-center py-12 md:py-20">
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" />
                </div>
              ) : storageMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
                  <Database className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mb-3 md:mb-4" />
                  <p className="text-sm md:text-base text-slate-500 font-bold">No media found in storage</p>
                  <p className="text-xs md:text-sm text-slate-400 mt-2">Upload media from the storage page first</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 lg:gap-4">
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
                          "relative aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group transition-all",
                          isSelected ? "border-2 md:border-4 border-primary" : "border border-transparent md:border-2 hover:border-primary"
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
                        <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 px-1.5 py-0.5 md:px-2 md:py-1 bg-black/60 backdrop-blur-md rounded md:rounded-lg flex items-center gap-1 md:gap-1.5">
                          {media.media_type === "image" ? (
                            <ImageIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                          ) : (
                            <VideoIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                          )}
                          <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest">
                            {media.media_type}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-[10px] md:text-xs font-bold truncate">{media.filename}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 w-6 h-6 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center z-10">
                            <Check className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" />
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

      {/* Generate Post Modal */}
      <AnimatePresence>
        {showGenerateIdeaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => !contentGeneratorWithImage.loading && setShowGenerateIdeaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[92vh]"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                    <span className="truncate">Generate Post</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                    Create a complete post with AI
                  </p>
                </div>
                <button
                  onClick={() => !contentGeneratorWithImage.loading && setShowGenerateIdeaModal(false)}
                  disabled={contentGeneratorWithImage.loading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-xs sm:text-sm font-black text-slate-900 mb-1.5 sm:mb-2 block">
                    Post Idea *
                  </label>
                  <Textarea
                    value={postIdea}
                    onChange={(e) => setPostIdea(e.target.value)}
                    placeholder="e.g., Share tips about social media marketing, announce new product launch...."
                    className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary rounded-xl"
                    disabled={contentGeneratorWithImage.loading}
                  />
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 font-medium">
                    Describe what you want to post about
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-black text-slate-900 mb-1.5 sm:mb-2 block">
                    Additional Requirements (Optional)
                  </label>
                  <Textarea
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="e.g., Make it casual, add emojis, focus on benefits..."
                    className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary rounded-xl"
                    disabled={contentGeneratorWithImage.loading}
                  />
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 font-medium">
                    Provide specific instructions for content style or tone
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowGenerateIdeaModal(false);
                      setPostIdea("");
                      setAdditionalRequirements("");
                    }}
                    disabled={contentGeneratorWithImage.loading}
                    className="h-11 sm:h-12 rounded-xl font-bold px-6 w-full sm:w-auto order-2 sm:order-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleGenerateFromIdea}
                    disabled={contentGeneratorWithImage.loading || !postIdea.trim() || !selectedPageId}
                    className="h-11 sm:h-12 rounded-xl font-black gap-2 px-8 bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-primary/20"
                  >
                    {contentGeneratorWithImage.loading ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assist Modal (for enhancing existing content) */}
      <AnimatePresence>
        {showAIModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => !contentEnhancer.loading && setShowAIModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                    <span className="truncate">Enhance Content</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                    Improve your existing content with AI
                  </p>
                </div>
                <button
                  onClick={() => !contentEnhancer.loading && setShowAIModal(false)}
                  disabled={contentEnhancer.loading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Content</p>
                  <div className="relative">
                    <p className={cn(
                      "text-sm text-slate-700 whitespace-pre-wrap",
                      !expandedContent['enhance'] && content.length > 300 && "line-clamp-6"
                    )}>
                      {content}
                    </p>
                    {content.length > 300 && (
                      <button
                        onClick={() => setExpandedContent(prev => ({ ...prev, enhance: !prev['enhance'] }))}
                        className="text-xs font-black text-primary mt-2 hover:underline"
                      >
                        {expandedContent['enhance'] ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-900 mb-2 block">
                    Enhancement Requirements (Optional)
                  </label>
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="E.g., Make it more engaging, add emojis, make it professional, improve grammar..."
                    className="min-h-[120px] text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary"
                    disabled={contentEnhancer.loading}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Provide specific instructions for how you want the content enhanced
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleEnhanceContent}
                    disabled={contentEnhancer.loading || !content.trim() || !selectedPageId}
                    className="w-full sm:flex-1 h-11 sm:h-12 rounded-xl font-black gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    {contentEnhancer.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Enhance Content
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAIModal(false);
                      setAiInput("");
                    }}
                    disabled={contentEnhancer.loading}
                    className="w-full sm:w-auto h-11 sm:h-12 rounded-xl font-bold px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Image Modal (Use Case 4: Generate image from content) */}
      <AnimatePresence>
        {showGenerateImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => !imageGenerator.loading && setShowGenerateImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-5 md:p-6 max-w-lg w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    <span className="truncate">Generate Image</span>
                  </h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5 sm:mt-1">
                    Create an image based on your content or requirements
                  </p>
                </div>
                <button
                  onClick={() => !imageGenerator.loading && setShowGenerateImageModal(false)}
                  disabled={imageGenerator.loading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-5 md:space-y-4">
                {content.trim() && (
                  <div className="bg-slate-50 rounded-2xl p-4 md:p-3 border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id="useExistingContent"
                        checked={useExistingContent}
                        onChange={(e) => setUseExistingContent(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        disabled={imageGenerator.loading}
                      />
                      <label htmlFor="useExistingContent" className="text-sm font-black text-slate-900 cursor-pointer">
                        Use content from textarea
                      </label>
                    </div>
                    {useExistingContent && (
                      <div className="relative">
                        <p className={cn(
                          "text-sm text-slate-700 whitespace-pre-wrap",
                          !expandedContent['generateImage'] && content.length > 300 && "line-clamp-6"
                        )}>
                          {content}
                        </p>
                        {content.length > 300 && (
                          <button
                            onClick={() => setExpandedContent(prev => ({ ...prev, generateImage: !prev['generateImage'] }))}
                            className="text-xs font-black text-primary mt-2 hover:underline"
                          >
                            {expandedContent['generateImage'] ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!useExistingContent && (
                  <div>
                    <label className="text-sm font-black text-slate-900 mb-2 md:mb-1.5 block">
                      Content for Image *
                    </label>
                    <Textarea
                      value={imageContent}
                      onChange={(e) => setImageContent(e.target.value)}
                      placeholder="e.g., A modern workspace with a laptop, plants, and natural lighting..."
                      className="min-h-[120px] md:min-h-[100px] text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary"
                      disabled={imageGenerator.loading}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Describe what you want the image to show
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-black text-slate-900 mb-2 md:mb-1.5 block">
                    Additional Requirements (Optional)
                  </label>
                  <Textarea
                    value={imageRequirements}
                    onChange={(e) => setImageRequirements(e.target.value)}
                    placeholder="e.g., Make it 3D, use vibrant colors, professional style, minimalist..."
                    className="min-h-[100px] md:min-h-[80px] text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary"
                    disabled={imageGenerator.loading}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Provide specific instructions for image style or appearance
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-4 md:pt-3 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowGenerateImageModal(false);
                      setImageContent("");
                      setImageRequirements("");
                      setUseExistingContent(true);
                    }}
                    disabled={imageGenerator.loading}
                    className="h-11 md:h-10 rounded-xl font-bold px-5 w-full sm:w-auto order-2 sm:order-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleGenerateImage}
                    disabled={imageGenerator.loading || (useExistingContent && !content.trim()) || (!useExistingContent && !imageContent.trim()) || !selectedPageId}
                    className="h-11 md:h-10 rounded-xl font-black gap-2 px-8 bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-primary/20"
                  >
                    {imageGenerator.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Image Modal (Use Case 5: Edit existing image) */}
      <AnimatePresence>
        {showEditImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => !imageEditor.loading && !imageEditor.lastEditedImage && setShowEditImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                    <span className="truncate">Edit Image</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-0.5 sm:mt-1">
                    {imageEditor.lastEditedImage 
                      ? "Choose between old and new image" 
                      : "Regenerate image based on your requirements"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!imageEditor.loading) {
                      setShowEditImageModal(false);
                      setEditImageRequirements("");
                      setSelectedImageForEdit(null);
                      imageEditor.reset();
                    }
                  }}
                  disabled={imageEditor.loading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              {imageEditor.lastEditedImage ? (
                // Show comparison view after editing
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">Original Image</h3>
                      <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 border-slate-200">
                        <img 
                          src={imageEditor.lastEditedImage.old_image_url} 
                          alt="Original" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        onClick={() => handleChooseImage(false)}
                        variant="outline"
                        className="w-full rounded-xl font-bold h-10 sm:h-12 text-sm sm:text-base"
                      >
                        Keep Original
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">Edited Image</h3>
                      <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 border-primary">
                        <img 
                          src={imageEditor.lastEditedImage.new_image_url} 
                          alt="Edited" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        onClick={() => handleChooseImage(true)}
                        className="w-full rounded-xl font-black bg-primary hover:bg-primary/90 h-10 sm:h-12 text-sm sm:text-base"
                      >
                        Use Edited
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Show edit form
                <div className="space-y-4 sm:space-y-6">
                  {selectedImageForEdit && (
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200">
                      <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Current Image</p>
                      <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden">
                        <img 
                          src={selectedImageForEdit} 
                          alt="Current" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs sm:text-sm font-black text-slate-900 mb-1.5 sm:mb-2 block">
                      Edit Requirements *
                    </label>
                    <Textarea
                      value={editImageRequirements}
                      onChange={(e) => setEditImageRequirements(e.target.value)}
                      placeholder="e.g., Make it 3D, change colors to blue, add more professional look, make it minimalist..."
                      className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary"
                      disabled={imageEditor.loading}
                    />
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">
                      Describe how you want to modify the image
                    </p>
                  </div>

                  {content.trim() && (
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200">
                      <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Reference Content (Optional)</p>
                      <div className="relative">
                        <p className={cn(
                          "text-xs sm:text-sm text-slate-700 whitespace-pre-wrap",
                          !expandedContent['editImage'] && content.length > 300 && "line-clamp-6"
                        )}>
                          {content}
                        </p>
                        {content.length > 300 && (
                          <button
                            onClick={() => setExpandedContent(prev => ({ ...prev, editImage: !prev['editImage'] }))}
                            className="text-[10px] sm:text-xs font-black text-primary mt-1.5 sm:mt-2 hover:underline"
                          >
                            {expandedContent['editImage'] ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 italic">This content will be used as context for image editing</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowEditImageModal(false);
                        setEditImageRequirements("");
                        setSelectedImageForEdit(null);
                      }}
                      disabled={imageEditor.loading}
                      className="h-10 sm:h-12 rounded-xl font-bold px-4 sm:px-6 w-full sm:w-auto order-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditImage}
                      disabled={imageEditor.loading || !editImageRequirements.trim() || !selectedImageForEdit || !selectedPageId}
                      className="h-10 sm:h-12 rounded-xl font-black gap-2 px-4 sm:px-6 bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 text-sm sm:text-base"
                    >
                      {imageEditor.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                          Edit Image
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image to Content Modal */}
      <AnimatePresence>
        {showImageToContentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => !imageToContentGenerator.loading && setShowImageToContentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                    <span className="truncate">Generate Content from Image</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                    Create post content based on your image
                  </p>
                </div>
                <button
                  onClick={() => !imageToContentGenerator.loading && setShowImageToContentModal(false)}
                  disabled={imageToContentGenerator.loading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {previewUrls.length > 0 && previewUrls[0] && (
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Selected Image</p>
                    <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden">
                      <img 
                        src={previewUrls[0]} 
                        alt="Selected" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {content.trim() && (
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Existing Content (Optional)</p>
                    <div className="relative">
                      <p className={cn(
                        "text-xs sm:text-sm text-slate-700 whitespace-pre-wrap",
                        !expandedContent['imageToContent'] && content.length > 300 && "line-clamp-6"
                      )}>
                        {content}
                      </p>
                      {content.length > 300 && (
                        <button
                          onClick={() => setExpandedContent(prev => ({ ...prev, imageToContent: !prev['imageToContent'] }))}
                          className="text-[10px] sm:text-xs font-black text-primary mt-1.5 sm:mt-2 hover:underline"
                        >
                          {expandedContent['imageToContent'] ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 italic">This content will be used as context for content generation</p>
                  </div>
                )}

                <div>
                  <label className="text-xs sm:text-sm font-black text-slate-900 mb-1.5 sm:mb-2 block">
                    Additional Requirements (Optional)
                  </label>
                  <Textarea
                    value={imageToContentRequirements}
                    onChange={(e) => setImageToContentRequirements(e.target.value)}
                    placeholder="e.g., Make it engaging, add emojis, focus on benefits, professional tone..."
                    className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary"
                    disabled={imageToContentGenerator.loading}
                  />
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">
                    Provide specific instructions for content style or tone
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowImageToContentModal(false);
                      setImageToContentRequirements("");
                    }}
                    disabled={imageToContentGenerator.loading}
                    className="h-11 sm:h-12 rounded-xl font-bold px-6 w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateContentFromImage}
                    disabled={imageToContentGenerator.loading || !selectedMediaId || !selectedPageId}
                    className="h-11 sm:h-12 rounded-xl font-black gap-2 px-8 bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-primary/20"
                  >
                    {imageToContentGenerator.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video to Content Modal */}
      <AnimatePresence>
        {showVideoToContentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
            onClick={() => !videoToContentGenerator.loading && setShowVideoToContentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                    <span className="truncate">Generate Content from Video</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                    Create post content based on your video
                  </p>
                </div>
                <button
                  onClick={() => !videoToContentGenerator.loading && setShowVideoToContentModal(false)}
                  disabled={videoToContentGenerator.loading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-50 shrink-0 ml-2"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {previewUrls.length > 0 && previewUrls[0] && (
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Selected Video</p>
                    <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-black">
                      <video 
                        src={previewUrls[0]} 
                        className="w-full h-full object-contain"
                        controls
                        playsInline
                      />
                    </div>
                  </div>
                )}

                {content.trim() && (
                  <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200">
                    <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2">Existing Content (Optional)</p>
                    <div className="relative">
                      <p className={cn(
                        "text-xs sm:text-sm text-slate-700 whitespace-pre-wrap",
                        !expandedContent['videoToContent'] && content.length > 300 && "line-clamp-6"
                      )}>
                        {content}
                      </p>
                      {content.length > 300 && (
                        <button
                          onClick={() => setExpandedContent(prev => ({ ...prev, videoToContent: !prev['videoToContent'] }))}
                          className="text-[10px] sm:text-xs font-black text-primary mt-1.5 sm:mt-2 hover:underline"
                        >
                          {expandedContent['videoToContent'] ? 'See less' : 'See more'}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 italic">This content will be used as context for content generation</p>
                  </div>
                )}

                <div>
                  <label className="text-xs sm:text-sm font-black text-slate-900 mb-1.5 sm:mb-2 block">
                    Additional Requirements (Optional)
                  </label>
                  <Textarea
                    value={videoToContentRequirements}
                    onChange={(e) => setVideoToContentRequirements(e.target.value)}
                    placeholder="e.g., Make it engaging, add emojis, focus on benefits, professional tone..."
                    className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base border-2 border-slate-200 focus:ring-1 focus:ring-primary"
                    disabled={videoToContentGenerator.loading}
                  />
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2">
                    Provide specific instructions for content style or tone
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowVideoToContentModal(false);
                      setVideoToContentRequirements("");
                    }}
                    disabled={videoToContentGenerator.loading}
                    className="h-11 sm:h-12 rounded-xl font-bold px-6 w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateContentFromVideo}
                    disabled={videoToContentGenerator.loading || !selectedMediaId || !selectedPageId}
                    className="h-11 sm:h-12 rounded-xl font-black gap-2 px-8 bg-primary hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-primary/20"
                  >
                    {videoToContentGenerator.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publish confirmation modal */}
      <AnimatePresence>
        {showPublishConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[240] flex items-center justify-center p-4"
            onClick={() => setShowPublishConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full mx-2 sm:mx-4 shadow-xl"
            >
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">Post to Facebook</h3>
              <p className="text-sm text-slate-600 mb-4">
                {selectedPage ? (selectedPage.page_name ?? selectedPage.page_vanity_name ?? selectedPage.page_id) : "No page selected"}
              </p>
              <p className="text-sm text-slate-500 mb-6">Do you want to continue?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowPublishConfirmModal(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowPublishConfirmModal(false);
                    handlePost();
                  }}
                  className="rounded-xl gap-2"
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posting Modal */}
      <AnimatePresence mode="wait">
        {showPostingModal && (
          <motion.div
            key={postingSuccess ? 'success' : 'loading'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full mx-2 sm:mx-4 text-center"
            >
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                {postingSuccess ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1.5 sm:mb-2">Post Created Successfully!</h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-bold">
                        Your post has been published to Facebook.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1.5 sm:mb-2">Creating Your Post</h3>
                      <p className="text-xs sm:text-sm text-slate-500 font-bold">
                        Please wait while we publish your post to Facebook...
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

export default function PostPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PostPageContent />
    </Suspense>
  );
}
