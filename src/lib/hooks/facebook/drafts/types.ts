export interface FacebookDraft {
  id: number;
  facebook_user_id?: string | null;
  page_id: string;
  content?: string | null;
  image_url?: string | null;
  media_id?: string | null;
  source_type?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface DraftListResponse {
  drafts: FacebookDraft[];
  count: number;
}
