"use client";

import { Loader2, Users, Heart, MessageCircle, Share2, Eye, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { usePageInsights, latestInsightValue } from "@/lib/hooks/facebook/pageInsights/usePageInsights";
import { cn } from "@/lib/utils";

function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  className?: string;
}

function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-100 bg-slate-50/80 p-4", className)}>
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

export interface PageInsightsStatsProps {
  pageId: string | null | undefined;
  pageName?: string | null;
  /** Increment to force live refetch (e.g. profile Refresh Data). */
  refreshToken?: number;
}

export function PageInsightsStats({ pageId, pageName, refreshToken }: PageInsightsStatsProps) {
  const { data, loading, error, reload } = usePageInsights(pageId);

  useEffect(() => {
    if (!pageId || refreshToken == null || refreshToken === 0) return;
    void reload({ refresh: true }).catch(() => undefined);
  }, [pageId, refreshToken, reload]);

  if (!pageId) {
    return (
      <p className="text-sm text-slate-500">
        Select a Facebook page from the header to view page stats.
      </p>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading page stats…
      </div>
    );
  }

  if (error && !data) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const page = data?.page;
  const posts = data?.posts_summary;
  const followers =
    page?.followers_count ??
    page?.fan_count ??
    latestInsightValue(data?.insights, "page_follows") ??
    0;
  const engagements =
    latestInsightValue(data?.insights, "page_post_engagements") ||
    posts?.total_engagement ||
    0;
  const reach =
    latestInsightValue(data?.insights, "page_total_media_view_unique") ||
    latestInsightValue(data?.insights, "page_media_view") ||
    0;
  const views = latestInsightValue(data?.insights, "page_media_view") || 0;

  const hasPostStats = Boolean(posts?.post_count);
  const showInsightsNote =
    Boolean(data?.insights_error) && !data?.insights?.length && !hasPostStats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {pageName || page?.name || "Page stats"}
          </h3>
          <p className="text-xs text-slate-500">Live from Facebook · last 28 days where noted</p>
        </div>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
      </div>

      {showInsightsNote ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {data?.insights_error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Followers" value={formatCount(followers)} icon={Users} />
        <StatCard label="Post engagement" value={formatCount(engagements)} icon={TrendingUp} />
        <StatCard label="Reach (28d)" value={formatCount(reach)} icon={Eye} />
        <StatCard label="Views (28d)" value={formatCount(views)} icon={Eye} />
        <StatCard label="Likes (recent)" value={formatCount(posts?.total_likes)} icon={Heart} />
        <StatCard label="Comments" value={formatCount(posts?.total_comments)} icon={MessageCircle} />
        <StatCard label="Shares" value={formatCount(posts?.total_shares)} icon={Share2} />
        <StatCard
          label="Posts sampled"
          value={formatCount(posts?.post_count)}
          icon={TrendingUp}
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
}
