import { apiFetch } from "@/lib/apiClient";
import { getCachedValue, setCachedValue } from "@/lib/cache";
import type { PageInsightsResponse } from "./types";

const CACHE_TTL_MS = 5 * 60 * 1000;

function cacheKey(pageId: string) {
  return `facebook_page_insights:v2:${pageId}`;
}

export async function fetchPageInsights(
  pageId: string,
  options?: { refresh?: boolean; period?: string; postsLimit?: number },
): Promise<PageInsightsResponse> {
  const refresh = options?.refresh === true;
  const period = options?.period ?? "days_28";
  const postsLimit = options?.postsLimit ?? 25;

  if (!refresh) {
    const cached = getCachedValue<PageInsightsResponse>(cacheKey(pageId));
    if (cached) return cached;
  }

  const params = new URLSearchParams({
    page_id: pageId,
    period,
    posts_limit: String(postsLimit),
    refresh: refresh ? "true" : "false",
  });

  const data = await apiFetch<PageInsightsResponse>(
    `/facebook/page-insights/?${params.toString()}`,
    { method: "GET" },
    { withAuth: true },
  );

  if (data.success) {
    setCachedValue(cacheKey(pageId), data, CACHE_TTL_MS);
  }
  return data;
}
