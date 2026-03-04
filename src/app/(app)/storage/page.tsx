"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Filter, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  ExternalLink,
  ChevronDown,
  Trash2,
  CheckSquare,
  Square,
  Check,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { uploadMedia, listMedia, deleteMedia, type MediaItem } from "@/lib/hooks/media/api";

type MediaType = "all" | "image" | "video";

interface MediaItemWithId extends MediaItem {
  id: string;
}

export default function StoragePage() {
  const [mediaItems, setMediaItems] = useState<MediaItemWithId[]>([]);
  const [filter, setFilter] = useState<MediaType>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const [selectedMediaForPost, setSelectedMediaForPost] = useState<MediaItemWithId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch media on mount
  useEffect(() => {
    loadMedia();
  }, [filter]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await listMedia({
        media_type: filter === "all" ? undefined : filter,
        platform: "facebook",
        limit: 100,
      });
      
      if (response.success) {
        const itemsWithId = response.media.map((item) => ({
          ...item,
          id: item.media_id,
        }));
        setMediaItems(itemsWithId);
      }
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter(item => filter === "all" || item.media_type === filter);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const deleteSelected = async () => {
    try {
      for (const id of selectedIds) {
        await deleteMedia(id);
      }
      await loadMedia();
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to delete media:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadFiles(prev => [...prev, ...files]);
    }
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      setUploadError("Please select at least one file");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadSuccess(null);

      // Determine media type from files
      const isVideo = uploadFiles.some(f => f.type.startsWith('video/'));
      const isImage = uploadFiles.some(f => f.type.startsWith('image/'));
      
      if (!isImage && !isVideo) {
        setUploadError("Unsupported file type. Please upload images or videos.");
        return;
      }

      if (uploadFiles.length === 1) {
        // Single upload
        const file = uploadFiles[0];
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        
        const result = await uploadMedia({
          media: file,
          media_type: mediaType,
          platform: 'facebook',
          onProgress: setUploadProgress,
        });

        if (result.success) {
          setUploadSuccess(`Successfully uploaded ${file.name}`);
          setUploadFiles([]);
          setShowUploadModal(false);
          await loadMedia();
        } else {
          setUploadError(result.message || 'Upload failed');
        }
      } else {
        // Multiple images upload (carousel)
        if (isVideo) {
          setUploadError("Multiple video uploads are not supported. Please upload one video at a time.");
          return;
        }

        const result = await uploadMedia({
          images: uploadFiles,
          media_type: 'images',
          platform: 'facebook',
          onProgress: setUploadProgress,
        });

        if (result.success && 'uploaded_count' in result) {
          setUploadSuccess(`Successfully uploaded ${result.uploaded_count} image(s)`);
          setUploadFiles([]);
          setShowUploadModal(false);
          await loadMedia();
        } else {
          setUploadError(result.message || 'Upload failed');
        }
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleUseMedia = (media: MediaItemWithId, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMediaForPost(media);
    setShowPostTypeModal(true);
  };

  const handlePostTypeSelect = (postType: string) => {
    if (selectedMediaForPost) {
      const mediaType = selectedMediaForPost.media_type;
      router.push(`/post?media_id=${selectedMediaForPost.media_id}&media_type=${mediaType}&post_type=${postType}`);
      setShowPostTypeModal(false);
      setSelectedMediaForPost(null);
    }
  };

  const getPostTypeOptions = (mediaType: string) => {
    if (mediaType === 'image') {
      return [
        { id: 'image', label: 'Photo Post', description: 'Post as a regular photo' },
        { id: 'story_image', label: 'Story (Image)', description: 'Post as an image story' },
        { id: 'carousel', label: 'Carousel', description: 'Add to carousel post' },
      ];
    } else if (mediaType === 'video') {
      return [
        { id: 'video', label: 'Video Post', description: 'Post as a regular video' },
        { id: 'story_video', label: 'Story (Video)', description: 'Post as a video story' },
      ];
    }
    return [];
  };

  return (
    <div className="p-4 md:p-10 min-h-screen">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Post Storage</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">Showing {filteredItems.length} of {mediaItems.length} media items</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Button 
                    onClick={deleteSelected}
                    variant="destructive" 
                    className="h-12 px-6 rounded-xl gap-2 font-black shadow-lg shadow-red-200 bg-red-500 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedIds.length})
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button 
                    onClick={() => setSelectedIds([])}
                    variant="ghost" 
                    className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Clear
                  </Button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="h-12 px-5 bg-white rounded-xl border-2 border-slate-100 flex items-center gap-3 font-bold text-slate-600 hover:border-primary/30 transition-all shadow-sm"
            >
              <Filter className="w-4 h-4" />
              {filter === "all" ? "All Media" : filter.charAt(0).toUpperCase() + filter.slice(1) + "s"}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilterDropdown ? "rotate-180" : "")} />
            </button>
            
            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 right-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                >
                  {["all", "image", "video"].map((type) => (
                    <button 
                      key={type}
                      onClick={() => {
                        setFilter(type as MediaType);
                        setShowFilterDropdown(false);
                      }}
                      className={cn(
                        "w-full px-5 py-3 text-left font-bold text-sm transition-colors",
                        filter === type ? "bg-primary text-white" : "text-slate-600 hover:bg-primary/5"
                      )}
                    >
                      {type === "all" ? "All Media" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button 
            onClick={selectAll}
            variant="outline" 
            className="h-12 px-6 rounded-xl gap-2 font-black border-slate-100 text-slate-600 hover:border-primary/30"
          >
            {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
            Select All
          </Button>

          <Button 
            onClick={() => setShowUploadModal(true)}
            className="h-12 px-8 rounded-xl gap-2 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                className={cn(
                  "bg-white rounded-[2.5rem] border transition-all duration-300 shadow-xl overflow-hidden group flex flex-col h-full relative cursor-pointer",
                  selectedIds.includes(item.id) ? "border-primary ring-4 ring-primary/5 shadow-primary/10" : "border-slate-100 shadow-primary/5 hover:border-primary/30"
                )}
                onClick={() => toggleSelect(item.id)}
              >
                {/* Selection Indicator */}
                <div className={cn(
                  "absolute top-5 left-5 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                  selectedIds.includes(item.id) ? "bg-primary border-primary text-white" : "bg-white/80 backdrop-blur-md border-white/50 text-transparent"
                )}>
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>

                {/* Media Preview */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {item.media_type === "image" ? (
                    <img 
                      src={item.public_url} 
                      alt={item.filename} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <video 
                      src={item.public_url} 
                      className="w-full h-full object-cover" 
                      controls
                      playsInline
                      onMouseEnter={(e) => {
                        // Auto-play on hover for better UX
                        const video = e.currentTarget;
                        video.muted = true;
                        video.play().catch(() => {
                          // Ignore autoplay errors
                        });
                      }}
                      onMouseLeave={(e) => {
                        // Pause when mouse leaves
                        const video = e.currentTarget;
                        video.pause();
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                  
                  {/* Overlay Badge */}
                  <div className="absolute top-5 right-5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                    {item.media_type === "image" ? <ImageIcon className="w-3 h-3 text-white" /> : <VideoIcon className="w-3 h-3 text-white" />}
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">{item.media_type}</span>
                  </div>
                </div>

                {/* Media Info */}
                <div className="p-6 flex-1 flex flex-col justify-between bg-white relative z-10">
                  <div>
                    <h3 className="text-[13px] font-black text-slate-900 truncate mb-1.5 uppercase tracking-tight">{item.filename}</h3>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-5 uppercase tracking-widest">
                      <span>{formatFileSize(item.file_size)}</span>
                      <span>{formatDate(item.uploaded_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      item.status === "uploaded" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {item.status}
                    </div>
                  <button 
                    onClick={(e) => handleUseMedia(item, e)}
                    className="text-primary hover:text-primary/80 transition-colors"
                    title="Use this media in a post"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (!uploading) {
                setShowUploadModal(false);
                setUploadFiles([]);
                setUploadError(null);
                setUploadSuccess(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900">Upload Media</h2>
                <button
                  onClick={() => {
                    if (!uploading) {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                      setUploadError(null);
                      setUploadSuccess(null);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  disabled={uploading}
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors mb-6"
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-bold mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-400">Images (JPG, PNG, GIF, WEBP) or Videos (MP4, MOV, AVI)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Files */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-bold text-slate-600 mb-2">Selected Files ({uploadFiles.length})</h3>
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-primary" />
                        ) : (
                          <VideoIcon className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeUploadFile(index)}
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                        disabled={uploading}
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm font-bold text-red-700">{uploadError}</p>
                </div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm font-bold text-green-700">{uploadSuccess}</p>
                </div>
              )}

              {/* Upload progress bar */}
              {uploading && (
                <div className="mb-6">
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{uploadProgress}%</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!uploading) {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                      setUploadError(null);
                      setUploadSuccess(null);
                    }
                  }}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl font-bold"
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 h-12 rounded-xl font-black bg-primary hover:bg-primary/90"
                  disabled={uploading || uploadFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Type Selection Modal */}
      <AnimatePresence>
        {showPostTypeModal && selectedMediaForPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPostTypeModal(false);
              setSelectedMediaForPost(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">Select Post Type</h2>
                <button
                  onClick={() => {
                    setShowPostTypeModal(false);
                    setSelectedMediaForPost(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                Choose how you want to post this {selectedMediaForPost.media_type}
              </p>

              <div className="space-y-3">
                {getPostTypeOptions(selectedMediaForPost.media_type).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handlePostTypeSelect(option.id)}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="font-black text-slate-900 mb-1 group-hover:text-primary transition-colors">
                      {option.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
