import { apiFetch } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/lib/config';

export interface FeedbackItemSummary {
  id: number;
  type: 'bug' | 'feature_request';
  title: string;
  description: string;
  status: 'open' | 'planned' | 'done';
  created_at: string;
  vote_count: number;
}

export interface FeedbackSubmitResponse {
  success: boolean;
  message: string;
  item?: FeedbackItemSummary;
  error?: string;
}

export interface FeedbackListResponse {
  success: boolean;
  message: string;
  items: FeedbackItemSummary[];
  error?: string;
}

export async function submitFeedbackRequest(payload: {
  type: 'bug' | 'feature_request';
  title: string;
  description: string;
}): Promise<FeedbackSubmitResponse> {
  const data = await apiFetch<FeedbackSubmitResponse>(
    API_ENDPOINTS.FEEDBACK.SUBMIT,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { withAuth: true }
  );
  return data;
}

export async function listFeedbackRequest(options?: {
  feedbackType?: 'bug' | 'feature_request';
  status?: 'open' | 'planned' | 'done';
  q?: string;
  sort?: 'votes' | 'newest';
  limit?: number;
  offset?: number;
}): Promise<FeedbackListResponse> {
  const params = new URLSearchParams();
  if (options?.feedbackType) params.append('feedback_type', options.feedbackType);
  if (options?.status) params.append('status', options.status);
  if (options?.q) params.append('q', options.q);
  if (options?.sort) params.append('sort', options.sort);
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));

  const url = `${API_ENDPOINTS.FEEDBACK.LIST}${params.size > 0 ? `?${params.toString()}` : ''}`;

  const data = await apiFetch<FeedbackListResponse>(
    url,
    { method: 'GET' },
    { withAuth: false }
  );
  return data;
}
