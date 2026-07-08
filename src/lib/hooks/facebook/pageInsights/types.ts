export interface PageInsightValue {
  end_time?: string | null;
  value: number;
}

export interface PageInsightMetric {
  name: string;
  title?: string | null;
  description?: string | null;
  period?: string | null;
  values: PageInsightValue[];
}

export interface PageOverview {
  page_id: string;
  name?: string | null;
  category?: string | null;
  fan_count?: number | null;
  followers_count?: number | null;
  picture_url?: string | null;
  link?: string | null;
}

export interface PostsSummary {
  post_count: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_engagement: number;
}

export interface PageInsightsResponse {
  success: boolean;
  message: string;
  source?: string;
  last_updated?: string | null;
  page?: PageOverview | null;
  insights?: PageInsightMetric[];
  posts_summary?: PostsSummary | null;
  insights_error?: string | null;
}
