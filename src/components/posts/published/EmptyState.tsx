"use client";

import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type: "no-posts" | "no-matches" | "no-filtered";
  pagesCount?: number;
  totalPosts?: number;
  onClearFilters?: () => void;
  variants?: any;
}

export function EmptyState({ 
  type, 
  pagesCount = 0, 
  totalPosts = 0, 
  onClearFilters,
  variants 
}: EmptyStateProps) {
  if (type === "no-posts") {
    return (
      <motion.div variants={variants} className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 font-bold text-lg mb-2">No Posts Found</p>
        <p className="text-sm text-slate-400 max-w-md">
          {pagesCount === 0
            ? "Connect your Facebook account and pages to see posts here"
            : "You haven't posted anything yet. Start creating posts to see them here!"}
        </p>
      </motion.div>
    );
  }

  if (type === "no-matches") {
    return (
      <motion.div variants={variants} className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 font-bold text-lg mb-2">No Posts Match Your Filters</p>
        <p className="text-sm text-slate-400 mb-4">
          Showing 0 of {totalPosts} posts. Try adjusting your search query or filter options.
        </p>
        {onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="mt-4 h-10 px-6 rounded-xl font-black"
          >
            Clear Filters
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="text-center py-20 bg-white rounded-2xl">
      <p className="text-slate-500 font-bold text-lg mb-2">No posts to display</p>
      <p className="text-sm text-slate-400">
        {totalPosts > 0 
          ? "Posts exist but don't match current filters. Try adjusting your selection."
          : "No posts found."}
      </p>
    </div>
  );
}
