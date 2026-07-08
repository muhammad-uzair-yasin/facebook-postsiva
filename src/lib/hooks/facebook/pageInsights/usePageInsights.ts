"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPageInsights } from "./api";
import type { PageInsightsResponse } from "./types";

export function usePageInsights(pageId: string | null | undefined) {
  const [data, setData] = useState<PageInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!pageId) {
        setData(null);
        setError(null);
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetchPageInsights(pageId, { refresh: options?.refresh });
        if (!res.success) {
          throw new Error(res.message || "Failed to load page insights");
        }
        setData(res);
        return res;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load page insights";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pageId],
  );

  useEffect(() => {
    if (!pageId) return;
    void load().catch(() => undefined);
  }, [pageId, load]);

  return { data, loading, error, reload: load };
}

export function latestInsightValue(
  insights: PageInsightsResponse["insights"],
  name: string,
): number {
  const metric = insights?.find((m) => m.name === name);
  const values = metric?.values ?? [];
  if (!values.length) return 0;
  return values[values.length - 1]?.value ?? 0;
}
