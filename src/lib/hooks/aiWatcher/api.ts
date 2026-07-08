import { apiFetch } from "../../apiClient";
import { buildApiUrl, API_ENDPOINTS } from "../../config";

export interface EnabledWatcherPost {
  post_id: string;
  platform: string;
  page_id: string | null;
  last_checked: string | null;
  total_comments: number;
  ai_replies_posted: number;
  leads_count: number;
  lead_keywords: string | null;
  lead_custom_rule: string | null;
}

export interface DetectedLead {
  id: number;
  post_id: string;
  comment_author: string;
  comment_text: string;
  is_lead: boolean;
  lead_confidence: number | null;
  ai_reply_text: string | null;
  platform?: string;
}

export interface WatcherRun {
  id: number;
  post_id: string;
  platform: string;
  ran_at: string;
  comments_fetched: number;
  comments_replied: number;
  leads_detected: number;
  errors: number;
  status: string;
}

export async function listEnabledWatcherPosts(platform = "facebook"): Promise<EnabledWatcherPost[]> {
  const url = `${buildApiUrl(API_ENDPOINTS.AI_WATCHER.LIST)}?platform=${encodeURIComponent(platform)}`;
  const data = await apiFetch<{ enabled_posts?: EnabledWatcherPost[] }>(url, { method: "GET" }, { withAuth: true });
  return data.enabled_posts ?? [];
}

export async function enableAiWatcher(body: {
  post_id: string;
  platform: string;
  page_id?: string | null;
}): Promise<void> {
  await apiFetch(
    buildApiUrl(API_ENDPOINTS.AI_WATCHER.ENABLE),
    { method: "POST", body: JSON.stringify(body) },
    { withAuth: true },
  );
}

export async function disableAiWatcher(body: { post_id: string; platform: string }): Promise<void> {
  await apiFetch(
    buildApiUrl(API_ENDPOINTS.AI_WATCHER.DISABLE),
    { method: "POST", body: JSON.stringify(body) },
    { withAuth: true },
  );
}

export async function updateLeadRules(body: {
  post_id: string;
  platform: string;
  lead_keywords?: string | null;
  lead_custom_rule?: string | null;
}): Promise<{ lead_keywords: string | null; lead_custom_rule: string | null }> {
  return apiFetch(
    buildApiUrl(API_ENDPOINTS.AI_WATCHER.RULES),
    { method: "PATCH", body: JSON.stringify(body) },
    { withAuth: true },
  );
}

export async function getDetectedLeads(params?: {
  platform?: string;
  is_lead?: boolean;
  limit?: number;
}): Promise<{ leads: DetectedLead[]; data?: { leads: DetectedLead[] }; total?: number }> {
  const qs = new URLSearchParams();
  if (params?.platform) qs.set("platform", params.platform);
  if (params?.is_lead !== undefined) qs.set("is_lead", String(params.is_lead));
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(
    `${buildApiUrl(API_ENDPOINTS.AI_WATCHER.LEADS)}${suffix}`,
    { method: "GET" },
    { withAuth: true },
  );
}

export async function getWatcherHistory(params?: {
  post_id?: string;
  platform?: string;
  limit?: number;
}): Promise<{ runs: WatcherRun[] }> {
  const qs = new URLSearchParams();
  if (params?.post_id) qs.set("post_id", params.post_id);
  if (params?.platform) qs.set("platform", params.platform);
  if (params?.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiFetch(
    `${buildApiUrl(API_ENDPOINTS.AI_WATCHER.HISTORY)}${suffix}`,
    { method: "GET" },
    { withAuth: true },
  );
}

export async function forceRunWatcher(postId: string, platform: string): Promise<void> {
  await apiFetch(
    `${buildApiUrl(API_ENDPOINTS.AI_WATCHER.FORCE_RUN)}/${encodeURIComponent(postId)}?platform=${encodeURIComponent(platform)}`,
    { method: "POST" },
    { withAuth: true },
  );
}
