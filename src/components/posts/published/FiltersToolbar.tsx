"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter,
  Search,
  ChevronDown,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacebookPage } from "@/lib/hooks/facebookoauth/types";

interface PostWithPage {
  page_id?: string;
  page_name?: string;
}

interface FiltersToolbarProps {
  pages: FacebookPage[];
  selectedPageId: string;
  onPageChange: (pageId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  postTypes: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredCount: number;
  totalCount: number;
}

export function FiltersToolbar({
  pages,
  selectedPageId,
  onPageChange,
  filter,
  onFilterChange,
  postTypes,
  searchQuery,
  onSearchChange,
  filteredCount,
  totalCount,
}: FiltersToolbarProps) {
  const [showPageFilter, setShowPageFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 bg-white p-4 rounded-3xl shadow-xl shadow-primary/5 border border-slate-100"
    >
      {/* Top Row: Page Filter and Post Type Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Page Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowPageFilter(!showPageFilter)}
              className="h-11 px-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 font-black text-xs text-slate-600 hover:border-primary/30 transition-all"
            >
              <Users className="w-4 h-4 text-primary" />
              {selectedPageId === "all" 
                ? "All Pages" 
                : pages.find(p => p.page_id === selectedPageId)?.page_name || "Select Page"}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showPageFilter ? "rotate-180" : "")} />
            </button>
            
            <AnimatePresence>
              {showPageFilter && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 left-0 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden max-h-64 overflow-y-auto"
                >
                  <button 
                    onClick={() => {
                      onPageChange("all");
                      setShowPageFilter(false);
                    }}
                    className={cn(
                      "w-full px-5 py-3 text-left font-black text-[10px] uppercase tracking-widest transition-colors",
                      selectedPageId === "all" ? "bg-primary text-white" : "text-slate-600 hover:bg-primary/5"
                    )}
                  >
                    All Pages
                  </button>
                  {pages.map((page) => (
                    <button 
                      key={page.page_id}
                      onClick={() => {
                        onPageChange(page.page_id);
                        setShowPageFilter(false);
                      }}
                      className={cn(
                        "w-full px-5 py-3 text-left font-black text-xs transition-colors",
                        selectedPageId === page.page_id ? "bg-primary text-white" : "text-slate-600 hover:bg-primary/5"
                      )}
                    >
                      {page.page_name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Post Type Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 px-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 font-black text-xs text-slate-600 hover:border-primary/30 transition-all"
            >
              <Filter className="w-4 h-4 text-primary" />
              {filter}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters ? "rotate-180" : "")} />
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                >
                  {["All Posts", ...postTypes].map((type) => (
                    <button 
                      key={type}
                      onClick={() => {
                        onFilterChange(type);
                        setShowFilters(false);
                      }}
                      className={cn(
                        "w-full px-5 py-3 text-left font-black text-[10px] uppercase tracking-widest transition-colors",
                        filter === type ? "bg-primary text-white" : "text-slate-600 hover:bg-primary/5"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">
            {filteredCount} of {totalCount} posts
            {selectedPageId !== "all" && ` (${pages.find(p => p.page_id === selectedPageId)?.page_name || ""})`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search posts..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-primary/30 transition-all font-medium"
          />
        </div>
      </div>
    </motion.div>
  );
}
