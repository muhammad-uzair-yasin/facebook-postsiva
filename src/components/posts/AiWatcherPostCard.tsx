"use client";

import { Loader2, Play, EyeOff, History, Users, Settings2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/posts/published/PostCard";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";

interface PostWithPage extends FacebookPost {
  page_name?: string;
  page_id?: string;
}

export interface AiWatcherPostCardProps {
  post: PostWithPage;
  stats: {
    total_comments: number;
    ai_replies_posted: number;
    leads_count: number;
  };
  running?: boolean;
  refreshing?: boolean;
  onSeeLeads: () => void;
  onSeeLastRun: () => void;
  onLeadRules: () => void;
  onRunNow: () => void;
  onDisable: () => void;
  onRefresh: () => void;
  leadsOpen?: boolean;
  runsOpen?: boolean;
}

export function AiWatcherPostCard({
  post,
  stats,
  running,
  refreshing,
  onSeeLeads,
  onSeeLastRun,
  onLeadRules,
  onRunNow,
  onDisable,
  onRefresh,
  leadsOpen,
  runsOpen,
}: AiWatcherPostCardProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh post"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <PostCard post={post} showPageName={false} aiWatcherEnabled />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <p className="mb-3 text-xs font-medium text-slate-500">
          {stats.total_comments} comments · {stats.ai_replies_posted} AI replies · {stats.leads_count}{" "}
          leads
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`rounded-lg ${leadsOpen ? "border-primary bg-primary/5 text-primary" : ""}`}
            onClick={onSeeLeads}
          >
            <Users className="mr-1 h-3.5 w-3.5" />
            See leads
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={`rounded-lg ${runsOpen ? "border-primary bg-primary/5 text-primary" : ""}`}
            onClick={onSeeLastRun}
          >
            <History className="mr-1 h-3.5 w-3.5" />
            See last run
          </Button>
          <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={onLeadRules}>
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            Lead rules
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={running}
            onClick={onRunNow}
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
            Run now
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-lg text-red-600"
            onClick={onDisable}
          >
            <EyeOff className="mr-1 h-3.5 w-3.5" />
            Disable
          </Button>
        </div>
      </div>
    </div>
  );
}
