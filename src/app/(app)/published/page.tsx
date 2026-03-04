"use client";

import { motion, Variants } from "framer-motion";
import { RefreshCw, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useRef } from "react";
import { fetchFacebookPosts } from "@/lib/hooks/facebook/posts/api";
import type { FacebookPage } from "@/lib/hooks/facebookoauth/types";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";
import { PostCard } from "./components/PostCard";
import { PageHeader } from "./components/PageHeader";
import { FiltersToolbar } from "./components/FiltersToolbar";
import { EmptyState } from "./components/EmptyState";
import { PostsGrid } from "./components/PostsGrid";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

interface PostWithPage extends FacebookPost {
  page_name?: string;
  page_id?: string;
}

interface PaginationState {
  after?: string;
  before?: string;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function PublishedPostsPage() {
  const [filter, setFilter] = useState("All Posts");
  const { selectedPage, pages } = useSelectedPage();
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [posts, setPosts] = useState<PostWithPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const hasInitialLoadedRef = useRef(false);
  
  // Pagination state
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<Record<string, PaginationState>>({});
  const [currentPagination, setCurrentPagination] = useState<PaginationState>({
    hasNext: false,
    hasPrevious: false,
  });

  // Sync selectedPageId with global selected page (pages from workspace, no GET /facebook/pages)
  useEffect(() => {
    if (selectedPage) {
      setSelectedPageId(selectedPage.page_id);
    }
  }, [selectedPage]);

  // On mount: load posts for selected page only, forceRefresh false (no pages/usage/profile APIs)
  useEffect(() => {
    if (hasInitialLoadedRef.current || pages.length === 0) return;
    hasInitialLoadedRef.current = true;
    const pageId = selectedPage?.page_id ?? pages[0]?.page_id;
    if (pageId) {
      setSelectedPageId(pageId);
      loadPosts(false, undefined, undefined, pageId);
    } else {
      setLoading(false);
    }
  }, [pages.length, selectedPage?.page_id, pages[0]?.page_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch posts when selectedPageId or pageSize changes (forceRefresh false)
  useEffect(() => {
    if (!hasInitialLoadedRef.current || pages.length === 0) return;
    loadPosts(false);
  }, [selectedPageId, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset pagination when page selection changes
  useEffect(() => {
    setCurrentPagination({ hasNext: false, hasPrevious: false });
    setPagination({});
  }, [selectedPageId]);

  const loadPosts = async (
    forceRefresh: boolean = false,
    after?: string,
    before?: string,
    pageIdOverride?: string,
  ) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use pages from context (workspace), no GET /facebook/pages
      const pagesArray = pages.length > 0 ? pages : [];
      if (pagesArray.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const effectivePageId = pageIdOverride ?? selectedPageId;

      // Fetch posts for selected page (or all pages) with forceRefresh false unless user clicked Refresh
      if (effectivePageId === "all") {
        // Load first pageSize posts from each page when "all" is selected
        const postsPromises = pagesArray.map(async (page) => {
          try {
            const postsResponse = await fetchFacebookPosts({
              pageId: page.page_id,
              limit: Math.ceil(pageSize / pagesArray.length) || 10,
              forceRefresh,
            });
            
            if (postsResponse.success && postsResponse.data && Array.isArray(postsResponse.data)) {
              return postsResponse.data.map((post) => ({
                ...post,
                page_name: page.page_name,
                page_id: page.page_id,
              }));
            }
            return [];
          } catch (err) {
            console.error(`Failed to load posts for page ${page.page_name}:`, err);
            return [];
          }
        });

        const allPostsArrays = await Promise.all(postsPromises);
        const allPosts = allPostsArrays.flat();

        // Sort by created_time (newest first)
        allPosts.sort((a, b) => {
          const timeA = a.created_time ? new Date(a.created_time).getTime() : 0;
          const timeB = b.created_time ? new Date(b.created_time).getTime() : 0;
          return timeB - timeA;
        });

        // Limit to pageSize
        setPosts(allPosts.slice(0, pageSize));
        setCurrentPagination({ hasNext: allPosts.length >= pageSize, hasPrevious: false });
      } else {
        // Load posts for selected page with pagination
        const selectedPageObj = pagesArray.find((p) => p.page_id === effectivePageId);
        if (!selectedPageObj) {
          setPosts([]);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        const postsResponse = await fetchFacebookPosts({
          pageId: effectivePageId,
          limit: pageSize,
          after: after,
          before: before,
          forceRefresh,
        });

        if (postsResponse.success && postsResponse.data && Array.isArray(postsResponse.data)) {
          const postsWithPage = postsResponse.data.map((post) => ({
            ...post,
            page_name: selectedPageObj.page_name,
            page_id: selectedPageObj.page_id,
          }));

          setPosts(postsWithPage);

          // Update pagination state
          const paging = postsResponse.paging;
          const newPagination: PaginationState = {
            after: paging?.cursors?.after,
            before: paging?.cursors?.before,
            hasNext: !!paging?.cursors?.after || !!paging?.next,
            hasPrevious: !!paging?.cursors?.before || !!paging?.previous,
          };
          setCurrentPagination(newPagination);
          setPagination((prev) => ({
            ...prev,
            [effectivePageId]: newPagination,
          }));
        } else {
          setPosts([]);
          setCurrentPagination({ hasNext: false, hasPrevious: false });
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load posts");
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  const handleNextPage = () => {
    if (currentPagination.after && selectedPageId !== "all") {
      loadPosts(false, currentPagination.after, undefined);
    }
  };

  const handlePreviousPage = () => {
    if (currentPagination.before && selectedPageId !== "all") {
      loadPosts(false, undefined, currentPagination.before);
    }
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

  // Group posts by page - use useMemo to prevent unnecessary recalculations
  const postsByPage = useMemo(() => {
    return posts.reduce((acc, post) => {
      const pageId = post.page_id || 'unknown';
      if (!acc[pageId]) {
        acc[pageId] = {
          page: pages.find(p => p.page_id === pageId) || { page_id: pageId, page_name: 'Unknown Page' },
          posts: []
        };
      }
      acc[pageId].posts.push(post);
      return acc;
    }, {} as Record<string, { page: FacebookPage | { page_id: string; page_name: string }, posts: PostWithPage[] }>);
  }, [posts, pages]);

  // Filter posts by selected page, type, and search - use useMemo
  const filteredPostsByPage = useMemo(() => {
    return Object.entries(postsByPage).reduce((acc, [pageId, { page, posts: pagePosts }]) => {
      // Filter by selected page
      if (selectedPageId !== "all" && pageId !== selectedPageId) {
        return acc;
      }

      const filtered = pagePosts.filter((post: PostWithPage) => {
        // Filter by post type if not "All Posts"
        if (filter !== "All Posts") {
          const postType = getPostType(post);
          if (postType !== filter) {
            return false;
          }
        }
        // Filter by search query if provided
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const message = post.message?.toLowerCase() || "";
          const story = post.story?.toLowerCase() || "";
          const pageName = post.page_name?.toLowerCase() || "";
          return message.includes(query) || story.includes(query) || pageName.includes(query);
        }
        return true;
      });

      if (filtered.length > 0) {
        acc[pageId] = { page, posts: filtered };
      }
      return acc;
    }, {} as Record<string, { page: FacebookPage | { page_id: string; page_name: string }, posts: PostWithPage[] }>);
  }, [postsByPage, selectedPageId, filter, searchQuery]);

  const postTypes = Array.from(new Set(posts.map(getPostType)));

  const filteredCount = Object.values(filteredPostsByPage).reduce(
    (sum: number, item: { posts: PostWithPage[] }) => sum + item.posts.length, 
    0
  );

  // Debug logging
  useEffect(() => {
    if (posts.length > 0) {
      console.log("Published Posts Debug:", {
        totalPosts: posts.length,
        postsByPageKeys: Object.keys(postsByPage),
        filteredPostsByPageKeys: Object.keys(filteredPostsByPage),
        selectedPageId,
        filter,
        searchQuery,
        postsByPageStructure: Object.entries(postsByPage).map(([k, v]) => ({
          pageId: k,
          pageName: v.page.page_name,
          postCount: v.posts.length
        }))
      });
    }
  }, [posts.length, selectedPageId, filter, searchQuery, postsByPage, filteredPostsByPage]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 md:p-6 lg:p-10 min-h-screen space-y-6 bg-slate-50"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Published Posts</h1>
          <p className="text-sm md:text-base text-slate-500 font-bold mt-1">
            View and manage all your live Facebook posts from all pages
          </p>
          {!loading && posts.length > 0 && (
            <p className="text-xs text-slate-400 font-bold mt-2">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} from {Object.keys(postsByPage).length} {Object.keys(postsByPage).length === 1 ? 'page' : 'pages'}
            </p>
          )}
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="h-12 px-8 rounded-xl gap-3 font-black shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
        >
          {refreshing || loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Refresh Feed
            </>
          )}
        </Button>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div variants={itemVariants} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Filters Toolbar */}
      {!loading && (
        <FiltersToolbar
          pages={pages}
          selectedPageId={selectedPageId}
          onPageChange={setSelectedPageId}
          filter={filter}
          onFilterChange={setFilter}
          postTypes={postTypes}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filteredCount={filteredCount}
          totalCount={posts.length}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-slate-500">Loading posts...</p>
        </div>
      )}

      {/* Empty States */}
      {!loading && !error && posts.length === 0 && (
        <EmptyState 
          type="no-posts" 
          pagesCount={pages.length}
          variants={itemVariants}
        />
      )}

      {!loading && !error && posts.length > 0 && Object.keys(filteredPostsByPage).length === 0 && (
        <EmptyState 
          type="no-matches" 
          totalPosts={posts.length}
          onClearFilters={() => {
            setSearchQuery("");
            setFilter("All Posts");
            setSelectedPageId("all");
          }}
          variants={itemVariants}
        />
      )}

      {/* Posts Display - Show selected page or all pages */}
      {!loading && !error && posts.length > 0 && (
        <div className="space-y-8 pb-10">
          {Object.keys(filteredPostsByPage).length > 0 ? (
            Object.entries(filteredPostsByPage).map(([pageId, { page, posts: pagePosts }]) => {
              console.log("Rendering page:", pageId, "with", pagePosts.length, "posts", "posts data:", pagePosts);
              if (!pagePosts || pagePosts.length === 0) {
                console.warn("PagePosts is empty for page:", pageId);
                return null;
              }
              return (
                <div key={pageId} className="space-y-4">
                  {/* Page Header - Only show if showing all pages */}
                  {selectedPageId === "all" && (
                    <PageHeader page={page} postCount={pagePosts.length} />
                  )}

                  {/* Posts Grid for this Page */}
                  <PostsGrid
                    posts={pagePosts}
                    showPageName={selectedPageId === "all"}
                    containerVariants={containerVariants}
                    itemVariants={itemVariants}
                  />
                </div>
              );
            })
          ) : (
            <EmptyState 
              type="no-filtered" 
              totalPosts={posts.length}
            />
          )}
        </div>
      )}

      {/* Pagination Controls - Only show when a specific page is selected */}
      {!loading && !error && posts.length > 0 && selectedPageId !== "all" && (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          {/* Page Size Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-600">Posts per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setPageSize(newSize);
                setCurrentPagination({ hasNext: false, hasPrevious: false });
                setPagination({});
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-primary transition-colors"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Pagination Info and Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">
              Showing {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </span>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousPage}
                disabled={!currentPagination.hasPrevious || loading}
                variant="outline"
                className="h-10 px-4 rounded-xl gap-2 font-black border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNextPage}
                disabled={!currentPagination.hasNext || loading}
                variant="outline"
                className="h-10 px-4 rounded-xl gap-2 font-black border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
