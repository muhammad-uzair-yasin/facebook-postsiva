"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disableAiWatcher,
  enableAiWatcher,
  forceRunWatcher,
  getDetectedLeads,
  getWatcherHistory,
  listEnabledWatcherPosts,
  updateLeadRules,
  type DetectedLead,
  type EnabledWatcherPost,
  type WatcherRun,
} from "@/lib/hooks/aiWatcher/api";
import { fetchFacebookPosts } from "@/lib/hooks/facebook/posts/api";
import type { FacebookPost } from "@/lib/hooks/facebook/posts/types";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";
import { Button } from "@/components/ui/button";
import { AiWatcherPostCard } from "@/components/posts/AiWatcherPostCard";
import { LeadRulesEditor } from "@/components/posts/AiWatcherLeadRules";
import { WatcherLeadsPanel, WatcherRunsPanel } from "@/components/posts/AiWatcherPanels";
import { AlertCircle, Loader2 } from "lucide-react";

const PLATFORM = "facebook";

interface WatcherRow extends EnabledWatcherPost {
  cardPost?: FacebookPost & { page_name?: string; page_id?: string };
  leads?: DetectedLead[];
  runs?: WatcherRun[];
}

function normalizeLeadsResponse(res: unknown): DetectedLead[] {
  if (!res || typeof res !== "object") return [];
  const obj = res as Record<string, unknown>;
  if (Array.isArray(obj.leads)) return obj.leads as DetectedLead[];
  const data = obj.data as Record<string, unknown> | undefined;
  if (data && Array.isArray(data.leads)) return data.leads as DetectedLead[];
  return [];
}

function normalizeRunsResponse(res: unknown): WatcherRun[] {
  if (!res || typeof res !== "object") return [];
  const obj = res as Record<string, unknown>;
  if (Array.isArray(obj.runs)) return obj.runs as WatcherRun[];
  if (Array.isArray(obj.data)) return obj.data as WatcherRun[];
  return [];
}

export default function AiWatcherScreen() {
  const { selectedPage } = useSelectedPage();
  const [posts, setPosts] = useState<WatcherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rulesPostId, setRulesPostId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [customRule, setCustomRule] = useState("");
  const [rulesSaving, setRulesSaving] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [expandedLeadsId, setExpandedLeadsId] = useState<string | null>(null);
  const [expandedRunsId, setExpandedRunsId] = useState<string | null>(null);

  const pageId = selectedPage?.page_id ?? "";
  const pageName = selectedPage?.page_name ?? "";

  const loadPostDetails = useCallback(
    async (enabledPosts: EnabledWatcherPost[]): Promise<WatcherRow[]> => {
      const pageIds = [
        ...new Set(
          enabledPosts
            .map((p) => p.page_id)
            .filter((id): id is string => Boolean(id && id.trim())),
        ),
      ];
      if (pageId && !pageIds.includes(pageId)) pageIds.push(pageId);

      const detailMap: Record<string, FacebookPost & { page_name?: string; page_id?: string }> = {};

      await Promise.all(
        pageIds.map(async (pid) => {
          try {
            const res = await fetchFacebookPosts({ pageId: pid, limit: 50 });
            (res.data ?? []).forEach((post) => {
              detailMap[post.id] = {
                ...post,
                page_id: pid,
                page_name: pageName || selectedPage?.page_name,
              };
            });
          } catch {
            /* ignore per-page fetch errors */
          }
        }),
      );

      return enabledPosts.map((wp) => ({
        ...wp,
        cardPost: detailMap[wp.post_id],
      }));
    },
    [pageId, pageName, selectedPage?.page_name],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const enabledPosts = await listEnabledWatcherPosts(PLATFORM);
      const filtered = pageId
        ? enabledPosts.filter((p) => !p.page_id || p.page_id === pageId)
        : enabledPosts;
      setPosts(await loadPostDetails(filtered));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load AI Watcher data");
    } finally {
      setLoading(false);
    }
  }, [pageId, loadPostDetails]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDisable = async (postId: string) => {
    await disableAiWatcher({ post_id: postId, platform: PLATFORM });
    setPosts((prev) => prev.filter((p) => p.post_id !== postId));
  };

  const handleSaveRules = async () => {
    if (!rulesPostId) return;
    setRulesSaving(true);
    try {
      const result = await updateLeadRules({
        post_id: rulesPostId,
        platform: PLATFORM,
        lead_keywords: keywords || null,
        lead_custom_rule: customRule || null,
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.post_id === rulesPostId
            ? { ...p, lead_keywords: result.lead_keywords, lead_custom_rule: result.lead_custom_rule }
            : p,
        ),
      );
      setRulesPostId(null);
    } finally {
      setRulesSaving(false);
    }
  };

  const handleForceRun = async (postId: string) => {
    setRunningId(postId);
    try {
      await forceRunWatcher(postId, PLATFORM);
      await refresh();
    } finally {
      setRunningId(null);
    }
  };

  const handleRefreshPost = async (row: WatcherRow) => {
    const pid = row.page_id || pageId;
    if (!pid) return;
    setRefreshingId(row.post_id);
    try {
      const res = await fetchFacebookPosts({ pageId: pid, limit: 50, forceRefresh: true });
      const match = (res.data ?? []).find((p) => p.id === row.post_id);
      if (match) {
        setPosts((prev) =>
          prev.map((p) =>
            p.post_id === row.post_id
              ? {
                  ...p,
                  cardPost: {
                    ...match,
                    page_id: pid,
                    page_name: pageName || selectedPage?.page_name,
                  },
                }
              : p,
          ),
        );
      }
    } finally {
      setRefreshingId(null);
    }
  };

  const handleSeeLeads = async (postId: string) => {
    if (expandedLeadsId === postId) {
      setExpandedLeadsId(null);
      return;
    }
    setExpandedLeadsId(postId);
    setExpandedRunsId(null);
    if (posts.find((p) => p.post_id === postId)?.leads) return;
    try {
      const all = normalizeLeadsResponse(await getDetectedLeads({ platform: PLATFORM, limit: 50 }));
      setPosts((prev) =>
        prev.map((p) => (p.post_id === postId ? { ...p, leads: all.filter((l) => l.post_id === postId) } : p)),
      );
    } catch {
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, leads: [] } : p)));
    }
  };

  const handleSeeLastRun = async (postId: string) => {
    if (expandedRunsId === postId) {
      setExpandedRunsId(null);
      return;
    }
    setExpandedRunsId(postId);
    setExpandedLeadsId(null);
    if (posts.find((p) => p.post_id === postId)?.runs) return;
    try {
      const runs = normalizeRunsResponse(
        await getWatcherHistory({ post_id: postId, platform: PLATFORM, limit: 10 }),
      );
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, runs } : p)));
    } catch {
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, runs: [] } : p)));
    }
  };

  return (
    <div className="min-h-full space-y-8 p-4 md:p-8 lg:p-10 xl:p-12 2xl:p-16">
      <div>
        <h2 className="text-2xl font-black text-slate-900">AI Watcher</h2>
        <p className="text-sm font-medium text-slate-500">
          Monitored posts, auto-replies, and detected leads for{" "}
          {selectedPage?.page_name ?? "your workspace"}
        </p>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-800">Watched posts ({posts.length})</h3>
          {posts.length === 0 ? (
            <p className="text-sm text-slate-500">
              Enable AI Watcher on a published post from the Published tab.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((wp) => (
                <div key={wp.post_id} className="flex flex-col gap-3">
                  {wp.cardPost ? (
                    <AiWatcherPostCard
                      post={wp.cardPost}
                      stats={{
                        total_comments: wp.total_comments,
                        ai_replies_posted: wp.ai_replies_posted,
                        leads_count: wp.leads_count,
                      }}
                      running={runningId === wp.post_id}
                      refreshing={refreshingId === wp.post_id}
                      leadsOpen={expandedLeadsId === wp.post_id}
                      runsOpen={expandedRunsId === wp.post_id}
                      onSeeLeads={() => void handleSeeLeads(wp.post_id)}
                      onSeeLastRun={() => void handleSeeLastRun(wp.post_id)}
                      onLeadRules={() => {
                        setRulesPostId(wp.post_id);
                        setKeywords(wp.lead_keywords ?? "");
                        setCustomRule(wp.lead_custom_rule ?? "");
                      }}
                      onRunNow={() => void handleForceRun(wp.post_id)}
                      onDisable={() => void handleDisable(wp.post_id)}
                      onRefresh={() => void handleRefreshPost(wp)}
                    />
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="font-mono text-xs text-slate-400 break-all">{wp.post_id}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Post details unavailable. Refresh or open Published tab first.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => void handleRefreshPost(wp)}>
                          Refresh
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => void handleSeeLeads(wp.post_id)}>
                          See leads
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => void handleSeeLastRun(wp.post_id)}>
                          See last run
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="rounded-lg text-red-600" onClick={() => void handleDisable(wp.post_id)}>
                          Disable
                        </Button>
                      </div>
                    </div>
                  )}
                  {expandedLeadsId === wp.post_id ? <WatcherLeadsPanel leads={wp.leads} /> : null}
                  {expandedRunsId === wp.post_id ? <WatcherRunsPanel runs={wp.runs} /> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <LeadRulesEditor
        open={Boolean(rulesPostId)}
        keywords={keywords}
        customRule={customRule}
        saving={rulesSaving}
        onKeywordsChange={setKeywords}
        onCustomRuleChange={setCustomRule}
        onCancel={() => setRulesPostId(null)}
        onSave={() => void handleSaveRules()}
      />
    </div>
  );
}

export { enableAiWatcher };
